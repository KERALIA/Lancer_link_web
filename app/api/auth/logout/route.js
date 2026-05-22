import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  
  // Sign out from Supabase
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[logout]", error);
  }

  // Always clear cookies even if signOut had an error
  const response = NextResponse.json({ ok: true });

  // Force-clear all Supabase auth cookies from the browser
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
