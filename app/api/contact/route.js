import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/contact
 *
 * Public endpoint — mirrors the portfolio's working implementation exactly.
 * Uses a fresh service-role client (same pattern as portfolio's createServerSupabaseClient).
 * Inserts into the shared `contact_messages` table with ip_hash to match
 * the existing table schema created by the portfolio project.
 */
export async function POST(request) {
  // ── 1. Parse body ──────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, email, message } = body ?? {};

  // ── 2. Sanitize (mirrors portfolio) ───────────────────────────
  const sanitize = (str) =>
    (str ?? "")
      .replace(/<[^>]*>/g, "")    // strip HTML tags
      .replace(/['";\\]/g, "")    // strip SQL special chars
      .trim();

  const cleanName    = sanitize(name);
  const cleanEmail   = sanitize(email).toLowerCase();
  const cleanMessage = sanitize(message);

  // ── 3. Validate ────────────────────────────────────────────────
  const fieldErrors = {};

  if (!cleanName)                                             fieldErrors.name    = "Name is required.";
  else if (cleanName.length > 120)                           fieldErrors.name    = "Name must be 120 characters or fewer.";

  if (!cleanEmail)                                            fieldErrors.email   = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) fieldErrors.email   = "Please enter a valid email address.";

  if (!cleanMessage)                                          fieldErrors.message = "Message is required.";
  else if (cleanMessage.length < 10)                         fieldErrors.message = "Message must be at least 10 characters.";
  else if (cleanMessage.length > 2000)                       fieldErrors.message = "Message must be 2000 characters or fewer.";

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      { error: "Validation failed.", details: fieldErrors },
      { status: 422 }
    );
  }

  // ── 4. Hash IP (mirrors portfolio) ────────────────────────────
  const ip     = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);

  // ── 5. Supabase credentials check ──────────────────────────────
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey ||
      supabaseUrl.includes("placeholder") ||
      serviceRoleKey.includes("placeholder")) {
    console.error("[POST /api/contact] Supabase env vars not configured.");
    return NextResponse.json(
      { error: "Database is not configured. Please contact the site owner directly." },
      { status: 503 }
    );
  }

  // ── 6. Fresh service-role client (exact same pattern as portfolio) ──
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // ── 7. Insert — include ip_hash to match the existing table schema ──
  const { error: dbError } = await supabase
    .from("contact_messages")
    .insert({
      name:     cleanName,
      email:    cleanEmail,
      message:  cleanMessage,
      ip_hash:  ipHash,
    });

  if (dbError) {
    console.error("[POST /api/contact] Supabase error:", dbError.message, dbError.details, dbError.hint);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
