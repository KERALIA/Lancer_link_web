import { NextResponse } from "next/server";
import { getSupabaseAdmin, SUPABASE_NOT_CONFIGURED_ERROR } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/api-auth";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export async function POST(request) {
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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Validation failed", details: { _body: "Invalid JSON" } },
        { status: 400 },
      );
    }

    const { client_email, project_name, progress_percent, invoice_status, invoice_amount, invoice_currency, github_url, figma_url, start_date, delivery_date, invoice_due_date } = body || {};

    /** @type {Record<string, string>} */
    const details = {};

    // Validate email
    const emailVal = typeof client_email === "string" ? client_email.trim() : "";
    if (!emailVal || !isValidEmail(emailVal)) {
      details.client_email = "A valid email address is required";
    }

    // Validate project name
    const nameVal = typeof project_name === "string" ? project_name.trim() : "";
    if (!nameVal) {
      details.project_name = "Project name is required";
    }

    // Validate progress
    const progressNum = Number(progress_percent ?? 0);
    if (!Number.isInteger(progressNum) || progressNum < 0 || progressNum > 100) {
      details.progress_percent = "Must be an integer between 0 and 100";
    }

    // Validate invoice status
    if (invoice_status !== "Pending" && invoice_status !== "Paid") {
      details.invoice_status = 'Must be "Pending" or "Paid"';
    }

    if (invoice_currency !== undefined && invoice_currency !== null && invoice_currency !== "") {
      if (invoice_currency !== "USD" && invoice_currency !== "INR") {
        details.invoice_currency = 'Must be "USD" or "INR"';
      }
    }

    // Validate invoice amount (optional)
    if (invoice_amount !== undefined && invoice_amount !== null && invoice_amount !== "") {
      const amt = Number(invoice_amount);
      if (Number.isNaN(amt) || amt <= 0) {
        details.invoice_amount = "Must be a positive number";
      } else if (String(Math.trunc(Math.abs(amt))).length > 6) {
        details.invoice_amount = "Maximum 6 digits in the whole part";
      }
    }

    // Validate github_url (optional)
    if (github_url && github_url.trim() !== "") {
      if (!isValidUrl(github_url)) {
        details.github_url = "Must be a valid http(s) URL";
      }
    }

    // Validate figma_url (optional)
    if (figma_url && figma_url.trim() !== "") {
      if (!isValidUrl(figma_url)) {
        details.figma_url = "Must be a valid http(s) URL";
      }
    }

    // Validate date fields (optional, accept YYYY-MM-DD or null)
    for (const [key, val] of [["start_date", start_date], ["delivery_date", delivery_date], ["invoice_due_date", invoice_due_date]]) {
      if (val !== undefined && val !== null && val !== "") {
        if (!isValidDateString(val)) {
          details[key] = "Must be a valid date in YYYY-MM-DD format";
        }
      }
    }

    if (Object.keys(details).length > 0) {
      return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
    }

    // Check for duplicate email
    const { data: existing } = await supabaseAdmin
      .from("lancerlink_projects")
      .select("id")
      .eq("client_email", emailVal)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Validation failed", details: { client_email: "A project with this email already exists" } },
        { status: 409 },
      );
    }

    const payload = {
      client_email: emailVal,
      project_name: nameVal,
      progress_percent: progressNum,
      invoice_status: invoice_status ?? "Pending",
      role: "client",
      updated_at: new Date().toISOString(),
    };

    if (invoice_amount !== undefined && invoice_amount !== null && invoice_amount !== "") {
      payload.invoice_amount = Number(invoice_amount);
    }

    if (invoice_currency === "INR" || invoice_currency === "USD") {
      payload.invoice_currency = invoice_currency;
    }

    if (github_url && github_url.trim() !== "") {
      payload.github_url = github_url.trim();
    }

    if (figma_url && figma_url.trim() !== "") {
      payload.figma_url = figma_url.trim();
    }

    if (start_date) {
      payload.start_date = start_date;
    }

    if (delivery_date) {
      payload.delivery_date = delivery_date;
    }

    if (invoice_due_date) {
      payload.invoice_due_date = invoice_due_date;
    }

    const { data, error } = await supabaseAdmin
      .from("lancerlink_projects")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[API /projects/create] Supabase error:", error);
      return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }

    return NextResponse.json({ success: true, created: data }, { status: 201 });
  } catch (err) {
    console.error("[API /projects/create] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
