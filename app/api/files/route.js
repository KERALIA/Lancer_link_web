import { NextResponse } from "next/server";
import { getSupabaseAdmin, SUPABASE_NOT_CONFIGURED_ERROR } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/api-auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

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

    // Look up project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("lancerlink_projects")
      .select("id")
      .eq("client_email", email.trim())
      .maybeSingle();

    if (projectError) {
      console.error("[API /files] Project lookup error:", projectError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch files
    const { data: files, error: filesError } = await supabaseAdmin
      .from("lancerlink_files")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (filesError) {
      console.error("[API /files] Files fetch error:", filesError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ files: files || [] }, { status: 200 });
  } catch (err) {
    console.error("[API /files] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
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

    const formData = await request.formData();
    const file = formData.get("file");
    const clientEmail = formData.get("client_email");
    const uploadedBy = formData.get("uploaded_by");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!clientEmail || typeof clientEmail !== "string" || !clientEmail.trim()) {
      return NextResponse.json(
        { error: "client_email is required" },
        { status: 400 },
      );
    }

    if (!uploadedBy || typeof uploadedBy !== "string" || !uploadedBy.trim()) {
      return NextResponse.json(
        { error: "uploaded_by is required" },
        { status: 400 },
      );
    }

    // Verify uploaded_by matches authenticated user's email by checking lancerlink_projects
    const { data: authProject } = await supabaseAdmin
      .from('lancerlink_projects')
      .select('client_email, role')
      .eq('client_email', auth.user.email)
      .maybeSingle();

    const userEmail = authProject?.client_email || auth.user.email;
    const userRole = authProject?.role || 'client';

    // Uploaded_by must match authenticated user's email
    if (userEmail !== uploadedBy.trim()) {
      return NextResponse.json(
        { error: "uploaded_by must match authenticated user's email" },
        { status: 403 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 },
      );
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 },
      );
    }

    // Look up project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("lancerlink_projects")
      .select("id, client_email")
      .eq("client_email", clientEmail.trim())
      .maybeSingle();

    if (projectError) {
      console.error("[API /files] Project lookup error:", projectError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Admin can upload for any client; clients can only upload for their own project
    if (userRole !== 'admin' && project.client_email !== userEmail) {
      return NextResponse.json(
        { error: "Unauthorized to upload files for this project" },
        { status: 403 }
      );
    }

// Build storage path
    const timestamp = Date.now();
    const fileName = file.name || "untitled";
    const storagePath = `${project.id}/${timestamp}_${fileName}`;

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("project-files")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("[API /files] Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Insert metadata row
    const { data: fileRow, error: insertError } = await supabaseAdmin
      .from("lancerlink_files")
      .insert({
        project_id: project.id,
        uploaded_by: uploadedBy.trim(),
        file_name: fileName,
        file_size: file.size,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[API /files] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to save file metadata" }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, file: fileRow },
      { status: 201 },
    );
  } catch (err) {
    console.error("[API /files] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
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
    const id = searchParams.get("id");

    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: "id query param is required" },
        { status: 400 },
      );
    }

    // Look up the file record
    const { data: fileRow, error: lookupError } = await supabaseAdmin
      .from("lancerlink_files")
      .select("*")
      .eq("id", id.trim())
      .maybeSingle();

    if (lookupError) {
      console.error("[API /files] File lookup error:", lookupError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!fileRow) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Verify ownership
    const { data: projectRow, error: projectError } = await supabaseAdmin
      .from("lancerlink_projects")
      .select("client_email")
      .eq("id", fileRow.project_id)
      .maybeSingle();

    if (projectError) {
      console.error("[API /files] Project lookup error:", projectError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!projectRow) {
      return NextResponse.json({ error: "Associated project not found" }, { status: 404 });
    }

    if (auth.role !== "admin" && auth.user.email.toLowerCase() !== projectRow.client_email.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from Supabase Storage
    const { error: storageError } = await supabaseAdmin.storage
      .from("project-files")
      .remove([fileRow.storage_path]);

    if (storageError) {
      console.error("[API /files] Storage delete error:", storageError);
      return NextResponse.json({ error: "Failed to delete file from storage" }, { status: 500 });
    }

    // Delete the database row
    const { error: deleteError } = await supabaseAdmin
      .from("lancerlink_files")
      .delete()
      .eq("id", id.trim());

    if (deleteError) {
      console.error("[API /files] Row delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete file record" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[API /files] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
