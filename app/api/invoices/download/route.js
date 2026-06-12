import { NextResponse } from "next/server";
import { getSupabaseAdmin, SUPABASE_NOT_CONFIGURED_ERROR } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/api-auth";
import { PLEX_REGULAR, PLEX_BOLD } from "@/lib/fonts";

// ─── Color Palette ───
const C = {
  indigo: [79, 70, 229],
  indigoLight: [224, 231, 255],
  slate800: [30, 41, 59],
  slate700: [51, 65, 85],
  slate500: [100, 116, 139],
  slate400: [148, 163, 184],
  slate300: [203, 213, 225],
  slate200: [226, 232, 240],
  slate100: [241, 245, 249],
  slate50: [248, 250, 252],
  white: [255, 255, 255],
  greenBg: [220, 252, 231],
  greenText: [6, 95, 70],
  amberBg: [254, 243, 199],
  amberText: [146, 64, 14],
};

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

const MILESTONES = [
  { min: 100, title: "Final Delivery & Handover", details: "Production deployment, documentation, and source code transfer." },
  { min: 75, title: "Beta Testing & Optimization", details: "User testing, performance optimization, and bug resolution." },
  { min: 50, title: "Core Feature Implementation", details: "Developing database logic, main views, and API connections." },
  { min: 25, title: "UI Prototype & Core Design", details: "Designing layouts, setting up design system, and static pages." },
  { min: 0, title: "Planning & Requirements", details: "Initial scoping, project setup, and design guidelines." },
];

function getMilestone(pct) {
  return MILESTONES.find((m) => pct >= m.min) ?? MILESTONES[MILESTONES.length - 1];
}

function generateInvoicePDF(project, jsPDFClass) {
  const currency = project.invoice_currency === "INR" ? "INR" : "USD";
  const doc = new jsPDFClass({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth(); // page width
  const ph = doc.internal.pageSize.getHeight();
  const m = 20; // margin
  const cw = pw - m * 2; // content width

  // ─── Register Custom Fonts ───
  doc.addFileToVFS("Plex-Regular.ttf", PLEX_REGULAR);
  doc.addFileToVFS("Plex-Bold.ttf", PLEX_BOLD);
  doc.addFont("Plex-Regular.ttf", "Plex", "normal");
  doc.addFont("Plex-Bold.ttf", "Plex", "bold");

  const invId = `#${project.id.substring(0, 8).toUpperCase()}`;
  const isPaid = project.invoice_status === "Paid";
  const genDate = formatDate(new Date().toISOString());
  const progressVal = project.progress_percent ?? 0;
  const milestone = getMilestone(progressVal);

  // ─── Font shorthand helpers (reduce boilerplate) ───
  const fnt = (style = "normal") => doc.setFont("Plex", style);
  const sz = (n) => doc.setFontSize(n);
  const clr = (...rgb) => doc.setTextColor(...rgb);

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 1 – HEADER
  // ══════════════════════════════════════════════════════════════════════
  doc.setFillColor(...C.indigo);
  doc.rect(m, 20, 4, 18, "F");

  fnt("bold"); sz(26); clr(...C.slate800);
  doc.text("LancerLink", m + 10, 29);

  fnt(); sz(8.5); clr(...C.slate500);
  doc.text("Freelance Project Management", m + 10, 35);

  // Right side: INVOICE title + ID
  fnt("bold"); sz(24); clr(...C.indigo);
  doc.text("INVOICE", pw - m, 28, { align: "right" });

  fnt(); sz(9); clr(...C.slate500);
  doc.text(invId, pw - m, 35, { align: "right" });

  doc.setDrawColor(...C.slate200);
  doc.setLineWidth(0.6);
  doc.line(m, 46, pw - m, 46);

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 2 – BILLING & INFO GRID
  // ══════════════════════════════════════════════════════════════════════
  let y = 52;

  doc.setFillColor(...C.slate50);
  doc.roundedRect(m, y - 2, cw, 32, 3, 3, "F");

  // -- Left: BILL TO --
  fnt("bold"); sz(8); clr(...C.slate500);
  doc.text("BILL TO", m + 6, y + 4);

  fnt("bold"); sz(11); clr(...C.slate800);
  doc.text(project.client_email || "—", m + 6, y + 12);

  fnt(); sz(8.5); clr(...C.slate500);
  doc.text(project.project_name || "Untitled Project", m + 6, y + 18);

  // -- Right: INVOICE DETAILS --
  const detX = pw / 2 + 10;
  const valX = detX + 30;

  fnt("bold"); sz(8); clr(...C.slate500);
  doc.text("INVOICE DETAILS", detX, y + 4);

  // Due date
  fnt(); sz(8.5); clr(...C.slate500);
  doc.text("Due Date:", detX, y + 11);
  fnt("bold"); clr(...C.slate800);
  doc.text(formatDate(project.invoice_due_date), valX, y + 11);

  // Generated date
  fnt(); clr(...C.slate500);
  doc.text("Generated:", detX, y + 17);
  fnt("bold"); clr(...C.slate800);
  doc.text(genDate, valX, y + 17);

  // Status badge
  fnt(); clr(...C.slate500);
  doc.text("Status:", detX, y + 23);

  const badgeW = isPaid ? 16 : 22;
  const badgeH = 5.5;
  const badgeY = y + 19.5;
  if (isPaid) {
    doc.setFillColor(...C.greenBg);
    doc.roundedRect(valX, badgeY, badgeW, badgeH, 2.5, 2.5, "F");
    fnt("bold"); sz(7.5); clr(...C.greenText);
    doc.text("PAID", valX + badgeW / 2, y + 23, { align: "center" });
  } else {
    doc.setFillColor(...C.amberBg);
    doc.roundedRect(valX, badgeY, badgeW, badgeH, 2.5, 2.5, "F");
    fnt("bold"); sz(7.5); clr(...C.amberText);
    doc.text("PENDING", valX + badgeW / 2, y + 23, { align: "center" });
  }

  y = 90;

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 3 – PROJECT TIMELINE (conditional)
  // ══════════════════════════════════════════════════════════════════════
  if (project.start_date || project.delivery_date) {
    doc.setFillColor(...C.slate50);
    doc.roundedRect(m, y, cw, 16, 3, 3, "F");

    fnt("bold"); sz(8); clr(...C.indigo);
    doc.text("PROJECT TIMELINE", m + 6, y + 5);

    fnt(); sz(8.5);
    if (project.start_date) {
      clr(...C.slate500);
      doc.text("Start Date:", m + 6, y + 11);
      fnt("bold"); clr(...C.slate800);
      doc.text(formatDate(project.start_date), m + 22, y + 11);
    }
    if (project.delivery_date) {
      fnt(); clr(...C.slate500);
      doc.text("Delivery Date:", pw / 2 - 20, y + 11);
      fnt("bold"); clr(...C.slate800);
      doc.text(formatDate(project.delivery_date), pw / 2 + 12, y + 11);
    }

    y += 22;
  }

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 4 – ITEMIZED TABLE
  // ══════════════════════════════════════════════════════════════════════
  y += 4;

  // Table header (indigo fill)
  doc.setFillColor(...C.indigo);
  doc.roundedRect(m, y, cw, 7, 2, 2, "F");

  fnt("bold"); sz(7.5); clr(...C.white);
  doc.text("DESCRIPTION", m + 6, y + 4.8);
  doc.text("DETAILS", m + cw * 0.52, y + 4.8);
  doc.text("AMOUNT", pw - m - 6, y + 4.8, { align: "right" });

  y += 9;

  // Table row
  doc.setFillColor(...C.slate50);
  doc.rect(m, y, cw, 18, "F");

  // Col 1: Project name + milestone
  fnt("bold"); sz(10); clr(...C.slate800);
  doc.text(project.project_name || "Untitled Project", m + 6, y + 4.5);

  fnt("bold"); sz(7.5); clr(...C.slate500);
  doc.text(milestone.title, m + 6, y + 9.5);

  fnt(); sz(7); clr(...C.slate400);
  doc.text(milestone.details, m + 6, y + 13.5);

  // Col 2: Progress
  fnt("bold"); sz(9.5); clr(...C.slate800);
  doc.text(`Progress: ${progressVal}%`, m + cw * 0.52, y + 4.5);

  fnt(); sz(7.5); clr(...C.slate500);
  doc.text(`Status: ${progressVal >= 100 ? "Completed" : "In Progress"}`, m + cw * 0.52, y + 9.5);

  // Col 3: Amount
  fnt("bold"); sz(11); clr(...C.slate800);
  doc.text(formatCurrency(project.invoice_amount, currency), pw - m - 6, y + 4.5, { align: "right" });

  y += 24;

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 5 – TOTAL DUE
  // ══════════════════════════════════════════════════════════════════════
  y += 3;

  doc.setDrawColor(...C.indigo);
  doc.setLineWidth(0.8);
  doc.line(m + cw * 0.42, y, pw - m, y);

  y += 5;

  fnt("bold"); sz(10); clr(...C.slate500);
  doc.text("Total Due:", m + cw * 0.42, y + 3);

  fnt("bold"); sz(17); clr(...C.indigo);
  doc.text(formatCurrency(project.invoice_amount, currency), pw - m - 2, y + 3, { align: "right" });

  y += 16;

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 6 – PAYMENT INSTRUCTIONS
  // ══════════════════════════════════════════════════════════════════════
  y += 2;

  doc.setFillColor(...C.slate50);
  doc.roundedRect(m, y, cw, 30, 3, 3, "F");

  const payX = m + 6;
  fnt("bold"); sz(8); clr(...C.indigo);
  doc.text("PAYMENT INSTRUCTIONS", payX, y + 5);

  fnt(); sz(8.5); clr(...C.slate500);
  doc.text("Payment Method:", payX, y + 11);
  fnt("bold"); clr(...C.slate800);
  doc.text("LancerLink Escrow", payX + 28, y + 11);

  fnt(); clr(...C.slate500);
  doc.text("Reference ID:", payX, y + 17);
  fnt("bold"); clr(...C.indigo);
  doc.text(`#${project.id.substring(0, 12).toUpperCase()}`, payX + 28, y + 17);

  // Right column: Terms
  const termsX = pw / 2 + 6;
  fnt("bold"); sz(8); clr(...C.indigo);
  doc.text("TERMS & SUPPORT", termsX, y + 5);

  const termsText =
    "Funds are held securely in LancerLink Escrow and released automatically upon project milestone approval. For assistance or support, please contact support@lancerlink.com.";
  const splitTerms = doc.splitTextToSize(termsText, cw / 2 - 14);
  fnt(); sz(8); clr(...C.slate500);
  doc.text(splitTerms, termsX, y + 11);

  y += 36;

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 7 – FOOTER
  // ══════════════════════════════════════════════════════════════════════
  const footerY = ph - 18;
  doc.setDrawColor(...C.slate200);
  doc.setLineWidth(0.5);
  doc.line(m, footerY - 5, pw - m, footerY - 5);

  fnt(); sz(7.5); clr(...C.slate400);
  doc.text(
    `Generated by LancerLink on ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    pw / 2,
    footerY,
    { align: "center" },
  );
  doc.text("This is a computer-generated invoice.", pw / 2, footerY + 4, { align: "center" });

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
