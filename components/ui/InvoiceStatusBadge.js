"use client";

const STYLES = {
  paid: {
    background: "var(--color-success-soft)",
    color: "var(--color-success-text)",
  },
  due: {
    background: "var(--color-warning-soft)",
    color: "var(--color-warning-text)",
  },
  overdue: {
    background: "var(--color-danger-soft)",
    color: "var(--color-danger-text)",
  },
  draft: {
    background: "var(--color-bg-tertiary)",
    color: "var(--color-text-secondary)",
  },
};

const LABELS = {
  paid: "Paid",
  due: "Due",
  overdue: "Overdue",
  draft: "Draft",
};

/**
 * @param {{ status: 'paid'|'due'|'overdue'|'draft' }} props
 */
export default function InvoiceStatusBadge({ status }) {
  const style = STYLES[status] || STYLES.draft;
  return (
    <span
      className="inline-block font-medium"
      style={{
        ...style,
        fontSize: 11,
        padding: "3px 8px",
        borderRadius: 4,
      }}
    >
      {LABELS[status] || status}
    </span>
  );
}
