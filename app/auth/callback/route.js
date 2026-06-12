import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { cookies } from "next/headers";

export const runtime = "nodejs";

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
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email;
  if (!email) {
    return NextResponse.redirect(`${origin}/login?error=no_email`);
  }

  // Handle invite and password-recovery redirects
  const type = requestUrl.searchParams.get("type");
  if (type === "invite" || type === "recovery") {
    return NextResponse.redirect(`${origin}/auth/setup-password`);
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

  return NextResponse.redirect(`${origin}/dashboard`);
}
