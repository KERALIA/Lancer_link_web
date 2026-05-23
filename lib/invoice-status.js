/**
 * Maps project invoice fields to UI badge status.
 * @param {{ invoice_status?: string, invoice_amount?: number | null, invoice_due_date?: string | null }} project
 * @returns {'paid' | 'due' | 'overdue' | 'draft'}
 */
export function mapInvoiceStatus(project) {
  if (!project) return "draft";

  const amount = project.invoice_amount;
  if (amount === null || amount === undefined || Number(amount) <= 0) {
    return "draft";
  }

  if (project.invoice_status === "Paid") {
    return "paid";
  }

  if (project.invoice_due_date) {
    const due = new Date(project.invoice_due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    if (due < today) {
      return "overdue";
    }
  }

  return "due";
}

/**
 * @param {string} id
 * @returns {string}
 */
export function formatInvoiceId(id) {
  if (!id) return "INV-0000";
  const short = String(id).replace(/-/g, "").slice(0, 4).toUpperCase();
  return `INV-${short}`;
}
