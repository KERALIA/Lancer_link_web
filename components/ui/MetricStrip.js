"use client";

/**
 * @typedef {{ label: string, value: string, delta?: string, deltaTone?: 'positive'|'warning'|'neutral', icon?: React.ReactNode }} MetricItem
 */

/**
 * @param {{ metrics: MetricItem[] }} props
 */
export default function MetricStrip({ metrics }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="relative metric-strip-item"
          style={{
            background: "var(--color-bg-secondary)",
            borderRadius: "var(--radius-md)",
            /* Responsive padding: tighter on mobile */
            padding: "clamp(10px, 2.5vw, 14px) clamp(12px, 3vw, 16px)",
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <span
              style={{
                /* Clamp label font size so it stays readable on 320px phones */
                fontSize: "clamp(9px, 2.5vw, 10px)",
                color: "var(--color-text-tertiary)",
                lineHeight: 1.3,
              }}
            >
              {m.label}
            </span>
            {m.icon && (
              <span style={{ opacity: 0.35, width: 15, height: 15, flexShrink: 0 }}>
                {m.icon}
              </span>
            )}
          </div>
          <p
            className="mt-1"
            style={{
              /* Clamp value font size: 16px on 320px phone, 20px on desktop */
              fontSize: "clamp(16px, 4vw, 20px)",
              fontWeight: 500,
              color: "var(--color-text-primary)",
              lineHeight: 1.2,
              /* Prevent overflow on very small widths */
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {m.value}
          </p>
          {m.delta && (
            <p
              className="mt-1"
              style={{
                fontSize: "clamp(9px, 2.5vw, 11px)",
                color:
                  m.deltaTone === "warning"
                    ? "var(--color-warning)"
                    : m.deltaTone === "positive"
                      ? "var(--color-success)"
                      : "var(--color-text-tertiary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {m.delta}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
