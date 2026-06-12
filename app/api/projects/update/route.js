import { NextResponse } from "next/server";
import { getSupabaseAdmin, SUPABASE_NOT_CONFIGURED_ERROR } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/api-auth";

function isValidUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidDateString(value) {
  if (typeof value !== "string") return false;
  // Accepts YYYY-MM-DD format
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

/**
 * @param {unknown} body
 * @returns {{ ok: true, payload: object } | { ok: false, details: Record<string, string> }}
 */
function validateUpdateBody(body) {
  /** @type {Record<string, string>} */
  const details = {};

  if (!body || typeof body !== "object") {
    return { ok: false, details: { _body: "JSON body is required" } };
  }

  const {
    client_email,
    project_name,
    progress_percent,
    invoice_status,
    invoice_amount,
    invoice_currency,
    github_url,
    figma_url,
    start_date,
    delivery_date,
    invoice_due_date,
  } = body;

  if (typeof client_email !== "string" || !client_email.trim()) {
    details.client_email = "Non-empty client_email is required";
  }

  const progressNum = Number(progress_percent);
  if (!Number.isInteger(progressNum)) {
    details.progress_percent = "Must be an integer between 0 and 100";
  } else if (progressNum < 0 || progressNum > 100) {
    details.progress_percent = "Must be an integer between 0 and 100";
  }

  if (invoice_status !== "Pending" && invoice_status !== "Paid") {
    details.invoice_status = 'Must be exactly "Pending" or "Paid"';
  }

  if (invoice_amount !== undefined && invoice_amount !== null) {
    const amt = Number(invoice_amount);
    if (Number.isNaN(amt) || amt <= 0) {
      details.invoice_amount = "Must be a positive number when provided";
    } else {
      const wholeDigits = String(Math.trunc(Math.abs(amt))).length;
      if (wholeDigits > 6) {
        details.invoice_amount = "Maximum 6 digits in the whole part";
      }
    }
  }

  if (invoice_currency !== undefined && invoice_currency !== null) {
    if (invoice_currency !== "USD" && invoice_currency !== "INR") {
      details.invoice_currency = 'Must be "USD" or "INR"';
    }
  }

  if (github_url !== undefined && github_url !== null && github_url !== "") {
    if (typeof github_url !== "string" || !isValidUrl(github_url)) {
      details.github_url = "Must be a valid http(s) URL when provided";
    }
  }

  if (figma_url !== undefined && figma_url !== null && figma_url !== "") {
    if (typeof figma_url !== "string" || !isValidUrl(figma_url)) {
      details.figma_url = "Must be a valid http(s) URL when provided";
    }
  }

  // Validate date fields (accept YYYY-MM-DD or null)
  for (const [key, val] of [["start_date", start_date], ["delivery_date", delivery_date], ["invoice_due_date", invoice_due_date]]) {
    if (val !== undefined && val !== null) {
      if (!isValidDateString(val)) {
        details[key] = "Must be a valid date in YYYY-MM-DD format or null";
      }
    }
  }

  // Validate project_name (optional but must be non-empty string if provided)
  if (project_name !== undefined && project_name !== null) {
    if (typeof project_name !== "string" || !project_name.trim()) {
      details.project_name = "Must be a non-empty string when provided";
    }
  }

  if (Object.keys(details).length > 0) {
    return { ok: false, details };
  }

  const payload = {
    client_email: client_email.trim(),
    progress_percent: progressNum,
    invoice_status,
    updated_at: new Date().toISOString(),
  };

  if (invoice_amount !== undefined && invoice_amount !== null) {
    payload.invoice_amount = Number(invoice_amount);
  }

  if (invoice_currency !== undefined && invoice_currency !== null) {
    payload.invoice_currency = invoice_currency === "INR" ? "INR" : "USD";
  }

  if (github_url !== undefined) {
    payload.github_url =
      github_url === null || github_url === "" ? null : github_url;
  }

  if (figma_url !== undefined) {
    payload.figma_url =
      figma_url === null || figma_url === "" ? null : figma_url;
  }

  // Date fields
  if (start_date !== undefined) {
    payload.start_date = start_date || null;
  }
  if (delivery_date !== undefined) {
    payload.delivery_date = delivery_date || null;
  }
  if (invoice_due_date !== undefined) {
    payload.invoice_due_date = invoice_due_date || null;
  }

  // Project name
  if (project_name !== undefined && project_name !== null) {
    payload.project_name = project_name.trim();
  }

  return { ok: true, payload };
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
        { error: "Validation failed", details: { _body: "Invalid JSON" } },
        { status: 400 },
      );
    }

    const validated = validateUpdateBody(body);
    if (!validated.ok) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.details },
        { status: 400 },
      );
    }

    const { client_email, progress_percent, invoice_status, updated_at } =
      validated.payload;

    if (auth.role !== "admin" && auth.user.email.toLowerCase() !== client_email.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /** @type {Record<string, unknown>} */
    const updates = {
      progress_percent,
      invoice_status,
      updated_at,
    };

    if (Object.prototype.hasOwnProperty.call(validated.payload, "invoice_amount")) {
      updates.invoice_amount = validated.payload.invoice_amount;
    }

    if (Object.prototype.hasOwnProperty.call(validated.payload, "invoice_currency")) {
      updates.invoice_currency = validated.payload.invoice_currency;
    }

    if (Object.prototype.hasOwnProperty.call(validated.payload, "github_url")) {
      updates.github_url = validated.payload.github_url;
    }

    if (Object.prototype.hasOwnProperty.call(validated.payload, "figma_url")) {
      updates.figma_url = validated.payload.figma_url;
    }

    if (Object.prototype.hasOwnProperty.call(validated.payload, "start_date")) {
      updates.start_date = validated.payload.start_date;
    }

    if (Object.prototype.hasOwnProperty.call(validated.payload, "delivery_date")) {
      updates.delivery_date = validated.payload.delivery_date;
    }

    if (Object.prototype.hasOwnProperty.call(validated.payload, "invoice_due_date")) {
      updates.invoice_due_date = validated.payload.invoice_due_date;
    }

    if (Object.prototype.hasOwnProperty.call(validated.payload, "project_name")) {
      updates.project_name = validated.payload.project_name;
    }

    const { data, error } = await supabaseAdmin
      .from("lancerlink_projects")
      .update(updates)
      .eq("client_email", client_email)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[API /projects/update] Supabase error:", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Validation failed", details: { client_email: "Project not found" } },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, updated: data }, { status: 200 });
  } catch (error) {
    console.error("[API /projects/update] Unexpected error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
