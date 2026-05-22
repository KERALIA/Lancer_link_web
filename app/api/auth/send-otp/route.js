import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function mapAuthError(error) {
  const msg = (error?.message || "").toLowerCase();
  const code = error?.code || error?.error_code || "";

  if (msg.includes("fetch failed") || code === "ECONNREFUSED" || code === "ENOTFOUND") {
    return "Cannot reach Supabase. Check your internet connection and NEXT_PUBLIC_SUPABASE_URL in .env.local, then restart the dev server.";
  }

  if (msg.includes("otp_disabled") || msg.includes("signups not allowed")) {
    return "Email login is disabled in Supabase. Enable Email provider under Authentication → Providers.";
  }

  if (msg.includes("rate limit") || code === "over_email_send_rate_limit") {
    return "Too many requests. Please wait a minute and try again.";
  }

  return error?.message || "Failed to send login link";
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Supabase is not configured. Copy .env.example to .env.local and add your project URL and keys.",
      },
      { status: 503 },
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { data: project, error: projectError } = await supabaseAdmin
    .from("lancerlink_projects")
    .select("client_email, role")
    .eq("client_email", email)
    .maybeSingle();

  if (projectError) {
    console.error("[send-otp] project lookup:", projectError);
    return NextResponse.json({ error: "Unable to verify access. Try again." }, { status: 500 });
  }

  if (!project) {
    return NextResponse.json(
      {
        error:
          "This email is not registered. Ask your freelancer to add you in the admin panel first.",
      },
      { status: 403 },
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  const redirectTo = `${siteUrl.replace(/\/$/, "")}/auth/callback`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("[send-otp]", error);
    return NextResponse.json(
      { error: mapAuthError(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({ sent: true });
}
