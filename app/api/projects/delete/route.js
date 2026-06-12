import { NextResponse } from "next/server";
import { getSupabaseAdmin, SUPABASE_NOT_CONFIGURED_ERROR } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/api-auth";

function normalizeEmail(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

async function resolveClientEmail(request) {
  const { searchParams } = new URL(request.url);
  const fromQuery = normalizeEmail(searchParams.get("email") ?? searchParams.get("client_email"));
  if (fromQuery) return fromQuery;

  try {
    const body = await request.json();
    return normalizeEmail(body?.client_email ?? body?.email);
  } catch {
    return null;
  }
}

export async function DELETE(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: SUPABASE_NOT_CONFIGURED_ERROR },
        { status: 503 },
      );
    }

    const clientEmail = await resolveClientEmail(request);
    if (!clientEmail) {
      return NextResponse.json(
        { error: "Validation failed", details: { client_email: "client_email is required" } },
        { status: 400 },
      );
    }

    const { data: projectRow, error: projectLookupError } = await supabaseAdmin
      .from("lancerlink_projects")
      .select("id, client_email, role")
      .eq("client_email", clientEmail)
      .maybeSingle();

    if (projectLookupError) {
      console.error("[API /projects/delete] Project lookup error:", projectLookupError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!projectRow) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (projectRow.role === "admin") {
      return NextResponse.json(
        { error: "Cannot delete admin project records" },
        { status: 403 },
      );
    }

    const projectId = projectRow.id;

    const { data: fileRows, error: filesLookupError } = await supabaseAdmin
      .from("lancerlink_files")
      .select("storage_path")
      .eq("project_id", projectId);

    if (filesLookupError) {
      console.error("[API /projects/delete] Files lookup error:", filesLookupError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const storagePaths = (fileRows || [])
      .map((f) => f.storage_path)
      .filter(Boolean);

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("project-files")
        .remove(storagePaths);

      if (storageError) {
        console.error("[API /projects/delete] Storage delete error:", storageError);
        return NextResponse.json(
          { error: "Failed to delete project files from storage" },
          { status: 500 },
        );
      }
    }

    const { error: projectDeleteError } = await supabaseAdmin
      .from("lancerlink_projects")
      .delete()
      .eq("id", projectId);

    if (projectDeleteError) {
      console.error("[API /projects/delete] Project delete error:", projectDeleteError);
      return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }

    let authDeleted = false;

    const { data: profileRow, error: profileLookupError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", clientEmail)
      .maybeSingle();

    if (profileLookupError) {
      console.error("[API /projects/delete] Profile lookup error:", profileLookupError);
      return NextResponse.json(
        {
          success: true,
          deletedEmail: clientEmail,
          authDeleted: false,
          warning: "Project deleted but profile lookup failed",
        },
        { status: 200 },
      );
    }

    if (profileRow?.id) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
        profileRow.id,
      );

      if (authDeleteError) {
        console.error("[API /projects/delete] Auth delete error:", authDeleteError);
        return NextResponse.json(
          {
            success: true,
            deletedEmail: clientEmail,
            authDeleted: false,
            warning: "Project deleted but auth user removal failed",
          },
          { status: 200 },
        );
      }

      authDeleted = true;
    }

    return NextResponse.json(
      { success: true, deletedEmail: clientEmail, authDeleted },
      { status: 200 },
    );
  } catch (err) {
    console.error("[API /projects/delete] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
