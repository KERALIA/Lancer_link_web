'use client';

/**
 * StatusBadge — Colored pill badge that maps a status string to a semantic color.
 *
 * Status mappings:
 *   'Paid' | 'Complete'   → green
 *   'Pending' | 'In Progress' → amber
 *   'Overdue'             → red
 *   default               → blue (info)
 */
export default function StatusBadge({ status }) {
  /** Resolve color classes + glow shadow based on status string */
  const getStatusStyles = () => {
    switch (status) {
      case 'Paid':
      case 'Complete':
        return {
          classes: 'bg-success-muted text-success border border-success/30',
          shadow: '0 0 12px rgba(34, 197, 94, 0.25)',
        };
      case 'Pending':
      case 'In Progress':
        return {
          classes: 'bg-warning-muted text-warning border border-warning/30',
          shadow: '0 0 12px rgba(245, 158, 11, 0.25)',
        };
      case 'Overdue':
        return {
          classes: 'bg-error-muted text-error border border-error/30',
          shadow: '0 0 12px rgba(239, 68, 68, 0.25)',
        };
      default:
        return {
          classes: 'bg-info-muted text-info border border-info/30',
          shadow: '0 0 12px rgba(59, 130, 246, 0.25)',
        };
    }
  };

  const { classes, shadow } = getStatusStyles();

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full font-medium text-xs uppercase tracking-wider ${classes}`}
      style={{ boxShadow: shadow }}
    >
      {status}
    </span>
  );
}
