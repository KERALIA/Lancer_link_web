import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/auth/login-password
 * Authenticate with email + password.
 * Rate limited to 5 attempts per email per minute.
 */
export async function POST(request) {
  try {
    let email, password;
    try {
      const body = await request.json();
      email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      password = typeof body.password === "string" ? body.password : "";
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 },
      );
    }

    // Require non-empty password
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }

    // Rate limiting: 5 attempts per email per minute
    const rl = checkRateLimit({ key: `login:${email}`, max: 5, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) },
        },
      );
    }

    // Check if email is registered in the portal
    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      const { data: project } = await supabaseAdmin
        .from("lancerlink_projects")
        .select("id")
        .eq("client_email", email)
        .maybeSingle();

      if (!project) {
        return NextResponse.json(
          {
            error: "This email is not registered in the portal yet.",
            notRegistered: true,
          },
          { status: 403 },
        );
      }
    }

    // Attempt password login via Supabase
    const supabase = await createSupabaseServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Rate limit error from Supabase
      if (
        signInError.status === 429 ||
        signInError.message?.toLowerCase().includes("rate limit")
      ) {
        return NextResponse.json(
          { error: "Too many attempts. Try again later." },
          { status: 429 },
        );
      }

      // Invalid credentials — generic message (don't leak which field is wrong)
      return NextResponse.json(
        { error: "Email or password is incorrect" },
        { status: 401 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API /auth/login-password] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
