import { NextResponse } from "next/server";
import { getSupabaseAdmin, SUPABASE_NOT_CONFIGURED_ERROR } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "email query param is required" },
        { status: 400 },
      );
    }

    const targetEmail = email.trim();

    if (auth.role !== "admin" && auth.user.email.toLowerCase() !== targetEmail.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from("lancerlink_projects")
      .select(`
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
      `)
      .eq("client_email", targetEmail)
      .maybeSingle();

    if (error) {
      console.error("[API /projects] Supabase error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[API /projects] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
