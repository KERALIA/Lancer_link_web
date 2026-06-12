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
        <div key={m.label} className="metric-strip-item">
          <div className="flex items-start justify-between gap-2">
            <span className="metric-strip-label">{m.label}</span>
            {m.icon && <span className="metric-strip-icon">{m.icon}</span>}
          </div>
          <p className="metric-strip-value">{m.value}</p>
          {m.delta && (
            <p
              className="metric-strip-delta"
              style={{
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
