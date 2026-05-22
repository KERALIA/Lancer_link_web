import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Returns the logged-in user and their project row (cached per request).
 * @returns {Promise<{ user: import("@supabase/supabase-js").User, role: 'client'|'admin', project: object | null } | null>}
 */
export const getDashboardAuth = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  if (!isSupabaseConfigured()) {
    return { user, role: "client", project: null };
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { user, role: "client", project: null };
  }

  const { data, error } = await supabaseAdmin
    .from("lancerlink_projects")
    .select("*")
    .eq("client_email", user.email)
    .maybeSingle();

  if (error) {
    console.error("[auth] projects lookup:", error);
    return { user, role: "client", project: null };
  }

  if (!data) {
    return { user, role: "client", project: null, notRegistered: true };
  }

  const role = data.role === "admin" ? "admin" : "client";
  return { user, role, project: data };
});

/**
 * Requires an authenticated user with a projects row; redirects otherwise.
 */
export async function requireDashboardAuth() {
  const auth = await getDashboardAuth();

  if (!auth?.user) {
    redirect("/login");
  }

  if (auth.notRegistered) {
    redirect("/access-denied");
  }

  return auth;
}

/**
 * @param {string} email
 * @returns {Promise<'client'|'admin'|null>}
 */
export async function getRoleForEmail(email) {
  if (!isSupabaseConfigured()) return null;

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return null;

  const { data } = await supabaseAdmin
    .from("lancerlink_projects")
    .select("role")
    .eq("client_email", email)
    .maybeSingle();

  if (!data) return null;
  return data.role === "admin" ? "admin" : "client";
}
