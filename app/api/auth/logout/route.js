import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const response = NextResponse.json({ ok: true });

  // 1. Get the current user before sign-out so we can admin-invalidate
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Sign out from Supabase (revokes the current session JWT)
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[logout] signOut error:", error);
  }

  // 3. Invalidate ALL sessions for this user via admin API
  if (user?.id) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      if (supabaseAdmin) {
        await supabaseAdmin.auth.admin.signOut(user.id);
      }
    } catch (adminErr) {
      console.error("[logout] admin signOut error:", adminErr);
    }
  }

  // 4. Force-clear all Supabase auth cookies from the browser
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
    }
  }

  return response;
}
