/**
 * Maps a Supabase `projects` row to the shape expected by `DashboardClient`.
 * @param {Record<string, unknown>} row
 */
export function mapRowToDashboardProject(row) {
  const githubUrl = row.github_url ? String(row.github_url).trim() : "";
  const hasGithub = Boolean(githubUrl);

  const figmaUrl = row.figma_url ? String(row.figma_url).trim() : "";
  const hasFigma = Boolean(figmaUrl);

  return {
    name: row.project_name,
    status: row.progress_percent >= 100 ? "Complete" : "In Progress",
    startDate: formatDate(row.start_date),
    deliveryDate: formatDate(row.delivery_date),
    progress: row.progress_percent ?? 0,
    invoice: {
      id: `#${String(row.id).slice(0, 8)}`,
      amount: Number(row.invoice_amount ?? 0),
      currency: row.invoice_currency === "INR" ? "INR" : "USD",
      status: row.invoice_status ?? "Pending",
      dueDate: formatDate(row.invoice_due_date),
    },
    resources: [
      {
        icon: "github",
        label: "View Project Repository",
        url: hasGithub ? githubUrl : "#",
        disabled: !hasGithub,
      },
      {
        icon: "figma",
        label: "Design Prototype",
        url: hasFigma ? figmaUrl : "#",
        disabled: !hasFigma,
      },
    ],
    clientEmail: row.client_email,
  };
}

/**
 * Formats a date value to a readable string, returning "—" for null/undefined.
 * @param {string | Date | null | undefined} dateValue
 * @returns {string}
 */
function formatDate(dateValue) {
  if (!dateValue) return "—";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}
