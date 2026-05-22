import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Authenticate request using Supabase session and return user with role.
 * Role is determined from lancerlink_projects table (same as getDashboardAuth).
 * @param {Request} request - Next.js request object
 * @returns {Promise<{user: any, role: string}|null>} - User object and role or null if unauthenticated
 */
export async function authenticateRequest(request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Determine role from lancerlink_projects (same as getDashboardAuth in lib/auth.js)
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { user, role: "client" };
  }

  const { data } = await supabaseAdmin
    .from("lancerlink_projects")
    .select("role")
    .eq("client_email", user.email)
    .maybeSingle();

  const role = data?.role === "admin" ? "admin" : "client";
  return { user, role };
}