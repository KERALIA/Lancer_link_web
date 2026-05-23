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
          className="relative"
          style={{
            background: "var(--color-bg-secondary)",
            borderRadius: "var(--radius-md)",
            padding: "14px 16px",
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <span
              style={{
                fontSize: 10,
                color: "var(--color-text-tertiary)",
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
              fontSize: 20,
              fontWeight: 500,
              color: "var(--color-text-primary)",
            }}
          >
            {m.value}
          </p>
          {m.delta && (
            <p
              className="mt-1"
              style={{
                fontSize: 11,
                color:
                  m.deltaTone === "warning"
                    ? "var(--color-warning)"
                    : m.deltaTone === "positive"
                      ? "var(--color-success)"
                      : "var(--color-text-tertiary)",
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
