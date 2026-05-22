import { NextResponse } from "next/server";
import { getSupabaseAdmin, SUPABASE_NOT_CONFIGURED_ERROR } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/api-auth";

function contentTypeForFileName(fileName) {
  const ext = (fileName || "").split(".").pop()?.toLowerCase();
  const map = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    zip: "application/zip",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    md: "text/markdown",
    txt: "text/plain",
    json: "application/json",
  };
  return map[ext] || "application/octet-stream";
}

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
    const id = searchParams.get("id");

    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: "id query param is required" },
        { status: 400 },
      );
    }

    const { data: fileRow, error: lookupError } = await supabaseAdmin
      .from("lancerlink_files")
      .select("*")
      .eq("id", id.trim())
      .maybeSingle();

    if (lookupError) {
      console.error("[API /files/download] File lookup error:", lookupError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!fileRow) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Verify ownership of the project associated with the file
    const { data: projectRow, error: projectError } = await supabaseAdmin
      .from("lancerlink_projects")
      .select("client_email")
      .eq("id", fileRow.project_id)
      .maybeSingle();

    if (projectError) {
      console.error("[API /files/download] Project lookup error:", projectError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!projectRow) {
      return NextResponse.json({ error: "Associated project not found" }, { status: 404 });
    }

    if (auth.role !== "admin" && auth.user.email.toLowerCase() !== projectRow.client_email.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
      .from("project-files")
      .download(fileRow.storage_path);

    if (downloadError || !fileBlob) {
      console.error("[API /files/download] Storage download error:", downloadError);
      return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
    }

    const fileName = fileRow.file_name || "download";
    const safeName = fileName.replace(/[^\w.\-() ]/g, "_");
    const contentType = contentTypeForFileName(fileName);

    return new NextResponse(fileBlob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[API /files/download] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
