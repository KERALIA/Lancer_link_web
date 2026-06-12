import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/auth/send-password-reset
 * Send a password reset email via Supabase.
 * Rate limited to 3 attempts per email per minute.
 */
export async function POST(request) {
  try {
    let email;
    try {
      const body = await request.json();
      email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 },
      );
    }

    // Rate limiting: 3 attempts per email per minute
    const rl = checkRateLimit({
      key: `password-reset:${email}`,
      max: 3,
      windowMs: 60_000,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) },
        },
      );
    }

    // Build the site URL for the redirect
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

    // Send password reset email via Supabase
    const supabase = await createSupabaseServerClient();
    const { error: resetError } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl.replace(/\/$/, "")}/auth/callback?type=recovery`,
      });

    if (resetError) {
      // Rate limit error from Supabase
      if (
        resetError.status === 429 ||
        resetError.message?.toLowerCase().includes("rate limit")
      ) {
        return NextResponse.json(
          { error: "Too many requests. Try again later." },
          { status: 429 },
        );
      }

      console.error("[API /auth/send-password-reset] Supabase error:", resetError);
      // Don't leak error details — return generic success
    }

    // Always return ok to avoid leaking whether email is registered
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API /auth/send-password-reset] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
