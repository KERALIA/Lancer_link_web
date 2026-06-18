import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { cookies } from "next/headers";

export const runtime = "nodejs";

/**
 * Copy Supabase session cookies (sb-* prefix) from the cookieStore
 * onto a NextResponse. Needed because Next.js 16 Route Handlers do not
 * automatically merge cookies() writes into a separately created NextResponse.
 */
async function withSessionCookies(response) {
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, cookie.value, {
        path: "/",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }
  }
  return response;
}

export async function GET(request) {
  const purpose = request.headers.get("purpose");
  const secFetchDest = request.headers.get("sec-fetch-dest");

  if (
    purpose === "prefetch" ||
    secFetchDest === "prefetch" ||
    secFetchDest === "empty"
  ) {
    return new Response(null, { status: 204 });
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();

  // ── Exchange the one-time code for a session first ──────────────
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[auth/callback] exchange:", exchangeError);

    // Clear all stale Supabase cookies so the next login attempt starts clean
    const redirectResponse = NextResponse.redirect(
      `${origin}/login?error=auth_failed`
    );
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.startsWith("sb-")) {
        redirectResponse.cookies.set(cookie.name, "", {
          path: "/",
          maxAge: 0,
          expires: new Date(0),
        });
      }
    }
    return redirectResponse;
  }

  // ── For recovery/invite flows, always go to setup-password ──────
  // This MUST happen before any dashboard redirect so password-reset
  // links never silently log the user in without setting a password.
  // We explicitly copy session cookies onto the redirect response because
  // Next.js 16 does not merge cookieStore writes into a new NextResponse.
  if (type === "invite" || type === "recovery") {
    const res = NextResponse.redirect(`${origin}/auth/setup-password`);
    return withSessionCookies(res);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email;
  if (!email) {
    return NextResponse.redirect(`${origin}/login?error=no_email`);
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  const { data: project } = await supabaseAdmin
    .from("lancerlink_projects")
    .select("role")
    .eq("client_email", email)
    .maybeSingle();

  if (!project) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/access-denied`);
  }

  const dashboardRes = NextResponse.redirect(`${origin}/dashboard`);
  return withSessionCookies(dashboardRes);
}
