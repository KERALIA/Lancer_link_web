import { NextResponse } from "next/server";
import { getSupabaseAdmin, SUPABASE_NOT_CONFIGURED_ERROR } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/api-auth";

function formatCurrency(amount, currency = "USD") {
  if (amount === null || amount === undefined) {
    return currency === "INR" ? "₹0.00" : "$0.00";
  }
  const code = currency === "INR" ? "INR" : "USD";
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
  }).format(Number(amount));
}

function formatDate(dateStr) {
  if (!dateStr) return "Not set";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Not set";
  }
}

function generateInvoicePDF(project, jsPDFClass) {
  const currency = project.invoice_currency === "INR" ? "INR" : "USD";
  const doc = new jsPDFClass({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const invoiceId = `#${project.id.substring(0, 8).toUpperCase()}`;
  const isPaid = project.invoice_status === "Paid";
  const generatedDate = formatDate(new Date().toISOString());

  // ─── Header (Minimal & Elegant) ───
  // Indigo vertical accent block
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(margin, 20, 4, 16, "F");

  // Brand Name
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("LancerLink", margin + 8, 28);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text("Freelance Project Management", margin + 8, 34);

  // INVOICE title (right aligned)
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text("INVOICE", pageWidth - margin, 27, { align: "right" });

  // Invoice ID (right aligned)
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(invoiceId, pageWidth - margin, 34, { align: "right" });

  // Thin divider under header
  doc.setDrawColor(241, 245, 249); // Slate 100
  doc.setLineWidth(0.5);
  doc.line(margin, 46, pageWidth - margin, 46);

  // ─── Billing & Info Grid (Side-by-side) ───
  let y = 56;

  // Left Column: Bill To
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text("BILL TO", margin, y);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text(project.client_email || "—", margin, y + 7);

  // Right Column: Invoice Details
  const detailsX = pageWidth / 2 + 10;
  const valueOffset = 28;
  const valueX = detailsX + valueOffset;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text("INVOICE DETAILS", detailsX, y);

  // Due Date
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text("Due Date:", detailsX, y + 7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text(formatDate(project.invoice_due_date), valueX, y + 7);

  // Generated Date
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Generated:", detailsX, y + 13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(generatedDate, valueX, y + 13);

  // Status with Soft-Pill Badge
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Status:", detailsX, y + 19);

  // Draw soft-pill badge
  const badgeW = 20;
  const badgeH = 5.2;
  const badgeY = y + 15.2; // centers nicely around y + 19 baseline
  if (isPaid) {
    doc.setFillColor(220, 252, 231); // Light Green #DCFCE7
    doc.roundedRect(valueX, badgeY, badgeW, badgeH, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52); // Dark Green #166534
    doc.text("PAID", valueX + badgeW / 2, y + 18.8, { align: "center" });
  } else {
    doc.setFillColor(254, 243, 199); // Light Amber #FEF3C7
    doc.roundedRect(valueX, badgeY, badgeW + 3, badgeH, 2, 2, "F"); // pending needs a bit wider pill
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14); // Dark Amber #92400E
    doc.text("PENDING", valueX + (badgeW + 3) / 2, y + 18.8, { align: "center" });
  }

  // Thin divider under grid
  y = 86;
  doc.setDrawColor(241, 245, 249); // Slate 100
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // ─── Itemized Progress Table ───
  y = 96;

  // Table Header Row (#F8FAFC)
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 8, "F");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text("DESCRIPTION", margin + 6, y + 5.5);
  doc.text("DETAILS", margin + contentWidth * 0.55, y + 5.5);
  doc.text("AMOUNT", pageWidth - margin - 6, y + 5.5, { align: "right" });

  // Determine milestone based on progress percent
  const progressVal = project.progress_percent ?? 0;
  let milestoneTitle = "Planning & Requirements";
  let milestoneDetails = "Initial scoping, project setup, and design guidelines.";
  if (progressVal >= 100) {
    milestoneTitle = "Final Delivery & Handover";
    milestoneDetails = "Production deployment, documentation, and source code transfer.";
  } else if (progressVal >= 75) {
    milestoneTitle = "Beta Testing & Optimization";
    milestoneDetails = "User testing, performance optimization, and bug resolution.";
  } else if (progressVal >= 50) {
    milestoneTitle = "Core Feature Implementation";
    milestoneDetails = "Developing database logic, main views, and API connections.";
  } else if (progressVal >= 25) {
    milestoneTitle = "UI Prototype & Core Design";
    milestoneDetails = "Designing layouts, setting up design system, and static pages.";
  }

  // Table Row Data
  y = 112;

  // Column 1: Description
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text(project.project_name || "Untitled Project", margin + 6, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(milestoneTitle, margin + 6, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(milestoneDetails, margin + 6, y + 9.5);

  // Column 2: Details (Progress & Status)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text(`Progress: ${progressVal}%`, margin + contentWidth * 0.55, y);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(`Status: ${progressVal >= 100 ? "Completed" : "In Progress"}`, margin + contentWidth * 0.55, y + 5);

  // Column 3: Amount
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text(formatCurrency(project.invoice_amount, currency), pageWidth - margin - 6, y, { align: "right" });

  // Thin divider under row
  y = 127;
  doc.setDrawColor(241, 245, 249); // Slate 100
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  // ─── Total Due ───
  y = 134;
  doc.setDrawColor(79, 70, 229); // Indigo 600
  doc.setLineWidth(0.8);
  doc.line(pageWidth - margin - 60, y, pageWidth - margin, y);

  y = 142;
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text("Total Due:", pageWidth - margin - 60, y);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text(formatCurrency(project.invoice_amount, currency), pageWidth - margin - 2, y, { align: "right" });

  // ─── Project Timeline (if dates available) ───
  if (project.start_date || project.delivery_date) {
    y = 153;
    doc.setDrawColor(241, 245, 249); // Slate 100
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    y = 160;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text("PROJECT TIMELINE", margin, y);

    y = 166;
    doc.setFontSize(9);
    if (project.start_date) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139); // Slate 500
      doc.text("Start Date:", margin, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59); // Slate 800
      doc.text(formatDate(project.start_date), margin + 18, y);
    }
    if (project.delivery_date) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139); // Slate 500
      doc.text("Delivery Date:", margin + 65, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59); // Slate 800
      doc.text(formatDate(project.delivery_date), margin + 88, y);
    }
  }

  // ─── Payment Instructions & Terms (Side-by-side) ───
  y = 178;
  doc.setDrawColor(241, 245, 249); // Slate 100
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y = 186;

  // Left Column: Payment Instructions
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text("PAYMENT INSTRUCTIONS", margin, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text("Payment Method:", margin, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text("LancerLink Escrow", margin + 30, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text("Reference ID:", margin, y + 12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text(`#${project.id.substring(0, 8).toUpperCase()}`, margin + 30, y + 12);

  // Right Column: Terms & Support
  const termsX = pageWidth / 2 + 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text("TERMS & SUPPORT", termsX, y);

  const termsText = "Funds are held securely in LancerLink Escrow and released automatically upon project milestone approval. For assistance or support, please contact support@lancerlink.com.";
  const splitTerms = doc.splitTextToSize(termsText, contentWidth / 2 - 10);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(splitTerms, termsX, y + 6);

  // ─── Footer ───
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(241, 245, 249); // Slate 100
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(
    `Generated by LancerLink on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );
  doc.text(
    "This is a computer-generated invoice.",
    pageWidth / 2,
    footerY + 4,
    { align: "center" }
  );

  return doc;
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

    // Fetch project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("lancerlink_projects")
      .select("*")
      .eq("client_email", targetEmail)
      .maybeSingle();

    if (projectError) {
      console.error("[API /invoices/download] Project lookup error:", projectError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { jsPDF } = await import("jspdf");
    const doc = generateInvoicePDF(project, jsPDF);
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    const invoiceId = project.id.substring(0, 8);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice_${invoiceId}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error("[API /invoices/download] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
