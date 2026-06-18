import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

// Force Node.js runtime (not Edge) so crypto and native modules work
export const runtime = "nodejs";

// ─── Simple HTML sanitiser (no JSDOM / DOMPurify needed) ─────────────────────
// Strips all HTML tags and encodes the five dangerous HTML entities.
// Input is already validated by Zod (trimmed, length-limited plain text).
function sanitize(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/<[^>]*>/g, ""); // strip any remaining tags
}

// ─── Zod input validation schema ─────────────────────────────────────────────
const ContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name must be 100 characters or fewer."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters.")
    .max(1500, "Message must be 1500 characters or fewer."),
});

/**
 * POST /api/contact
 *
 * Public endpoint for the contact form.
 *  - Zod schema validation (structure + types)
 *  - HTML entity sanitization (XSS prevention, no JSDOM dependency)
 *  - In-memory rate limiting (10 req / 60s per IP hash)
 *  - Inserts into contact_messages table with ip_hash
 */
export async function POST(request) {
  try {
    // ── 1. Parse body ──────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    // ── 2. Validate JSON schema structure ──────────────────────────
    const result = ContactSchema.safeParse(body);

    if (!result.success) {
      const details = {};
      result.error.issues.forEach((issue) => {
        details[issue.path[0]] = issue.message;
      });
      return NextResponse.json(
        { error: "Validation failed.", details },
        { status: 422 }
      );
    }

    const { name, email, message } = result.data;

    // ── 3. Sanitize against HTML/JS injection ──────────────────────
    const cleanName    = sanitize(name).trim();
    const cleanEmail   = sanitize(email).toLowerCase().trim();
    const cleanMessage = sanitize(message).trim();

    // ── 4. Hash IP for rate limiting ───────────────────────────────
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);

    // ── 5. Rate limit by IP — 10 submissions per minute ────────────
    const rateCheck = checkRateLimit({
      key: `contact:${ipHash}`,
      max: 10,
      windowMs: 60_000,
    });

    if (!rateCheck.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateCheck.resetInMs / 1000)),
          },
        }
      );
    }

    // ── 6. Supabase credentials check ──────────────────────────────
    const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      supabaseUrl.includes("placeholder") ||
      supabaseUrl === "https://your-project.supabase.co" ||
      serviceRoleKey.includes("placeholder") ||
      serviceRoleKey === "your-service-role-key"
    ) {
      console.error("[POST /api/contact] Supabase env vars not configured.");
      return NextResponse.json(
        {
          error:
            "Database is not configured. Please contact the site owner directly.",
        },
        { status: 503 }
      );
    }

    // ── 7. Standalone service-role client with native fetch ─────────
    // Uses globalThis.fetch — always available on Vercel (Node 18+).
    // Does NOT use the shared supabaseFetch/undici to avoid crashes
    // on Vercel's serverless runtime.
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { fetch: globalThis.fetch },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // ── 8. Insert — include ip_hash to match existing table schema ──
    const { error: dbError } = await supabase.from("contact_messages").insert({
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
      ip_hash: ipHash,
    });

    if (dbError) {
      console.error(
        "[POST /api/contact] Supabase DB error:",
        "code:", dbError.code,
        "message:", dbError.message,
        "details:", dbError.details,
        "hint:", dbError.hint
      );

      let userMsg = "Failed to send message. Please try again later.";
      if (dbError.code === "42P01") {
        userMsg =
          "The contact system is not fully set up yet. Please email the site owner directly.";
      }

      return NextResponse.json({ error: userMsg }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (unexpectedErr) {
    console.error(
      "[POST /api/contact] Unexpected error:",
      unexpectedErr?.message ?? String(unexpectedErr)
    );
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
