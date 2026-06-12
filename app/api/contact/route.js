import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { checkRateLimit } from "@/lib/rate-limit";

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
 *  - DOMPurify sanitization (XSS prevention)
 *  - In-memory rate limiting (10 req / 60s per IP hash)
 *  - Inserts into contact_messages table with ip_hash
 */
export async function POST(request) {
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
  const cleanName = DOMPurify.sanitize(name).trim();
  const cleanEmail = DOMPurify.sanitize(email).toLowerCase().trim();
  const cleanMessage = DOMPurify.sanitize(message).trim();

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    supabaseUrl.includes("placeholder") ||
    serviceRoleKey.includes("placeholder")
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

  // ── 7. Fresh service-role client ───────────────────────────────
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
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
      "[POST /api/contact] Supabase error:",
      dbError.message,
      dbError.details,
      dbError.hint
    );
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
