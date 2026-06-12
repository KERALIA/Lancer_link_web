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

    // Look up the project by client_email
    const { data: project, error: projectError } = await supabaseAdmin
      .from("lancerlink_projects")
      .select("id")
      .eq("client_email", email.trim())
      .maybeSingle();

    if (projectError) {
      console.error("[API /messages] Project lookup error:", projectError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch messages for this project (bounded to 500)
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("lancerlink_messages")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true })
      .limit(500);

    if (messagesError) {
      console.error("[API /messages] Messages fetch error:", messagesError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json(
      { messages: messages || [], projectId: project.id },
      { status: 200 },
    );
  } catch (err) {
    console.error("[API /messages] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { client_email, sender_email, sender_role, content } = body || {};

    // Validate required fields
    if (!client_email || typeof client_email !== "string" || !client_email.trim()) {
      return NextResponse.json(
        { error: "client_email is required" },
        { status: 400 },
      );
    }

    if (!sender_email || typeof sender_email !== "string" || !sender_email.trim()) {
      return NextResponse.json(
        { error: "sender_email is required" },
        { status: 400 },
      );
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 },
      );
    }

    const senderEmailTrimmed = sender_email.trim();
    const clientEmailTrimmed = client_email.trim();

    // Ensure sender_email matches the authenticated user's email
    if (auth.user.email.toLowerCase() !== senderEmailTrimmed.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ensure client_email matches session email if client
    if (auth.role !== "admin" && auth.user.email.toLowerCase() !== clientEmailTrimmed.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const role = auth.role === "admin" ? "admin" : "client";

    // Look up the project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("lancerlink_projects")
      .select("id")
      .eq("client_email", client_email.trim())
      .maybeSingle();

    if (projectError) {
      console.error("[API /messages] Project lookup error:", projectError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Insert the message
    const { data: message, error: insertError } = await supabaseAdmin
      .from("lancerlink_messages")
      .insert({
        project_id: project.id,
        sender_email: sender_email.trim(),
        sender_role: role,
        content: content.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("[API /messages] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, message },
      { status: 201 },
    );
  } catch (err) {
    console.error("[API /messages] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
