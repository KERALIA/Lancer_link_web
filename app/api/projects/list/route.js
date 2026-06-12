import { NextResponse } from "next/server";
import { getSupabaseAdmin, SUPABASE_NOT_CONFIGURED_ERROR } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(request) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: SUPABASE_NOT_CONFIGURED_ERROR },
        { status: 503 },
      );
    }

    // Fetch projects based on user role
    let query = supabaseAdmin.from("lancerlink_projects").select(`
      id,
      client_email,
      project_name,
      progress_percent,
      invoice_status,
      invoice_amount,
      role,
      start_date,
      delivery_date,
      invoice_due_date,
      github_url,
      figma_url,
      invoice_currency,
      created_at,
      updated_at
    `);

    // If user is admin, they can see all projects
    // If user is client, they can only see their own project
    if (auth.role !== 'admin') {
      // Use auth.user.email directly instead of extra profiles lookup (N+1 fix)
      query = query.eq("client_email", auth.user.email);
    }

    const { data: projects, error } = await query
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[API /projects/list] Supabase error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ projects: projects || [] }, { status: 200 });
  } catch (err) {
    console.error("[API /projects/list] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
