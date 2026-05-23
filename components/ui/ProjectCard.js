"use client";

function progressColor(percent) {
  if (percent <= 40) return "var(--color-danger)";
  if (percent <= 70) return "var(--color-warning)";
  return "var(--color-brand)";
}

function formatShortDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function isBehindSchedule(deliveryDate, progress) {
  if (!deliveryDate || progress >= 100) return false;
  const d = new Date(deliveryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

/**
 * @param {object} props
 * @param {string} props.name
 * @param {number} props.progress
 * @param {string} [props.deliveryDate]
 * @param {number} [props.memberCount]
 * @param {number} [props.fileCount]
 * @param {() => void} [props.onClick]
 */
export default function ProjectCard({
  name,
  progress = 0,
  deliveryDate,
  memberCount = 1,
  fileCount,
  onClick,
}) {
  const pct = Math.min(100, Math.max(0, Number(progress) || 0));
  const behind = isBehindSchedule(deliveryDate, pct);
  const fillColor = progressColor(pct);

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
      className="transition cursor-pointer"
      style={{
        background: "var(--color-bg-primary)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: 16,
        boxShadow: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-brand)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
          {name || "Untitled Project"}
        </span>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{pct}%</span>
      </div>
      <div
        style={{
          height: 6,
          background: "var(--color-bg-tertiary)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: fillColor,
            borderRadius: 3,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <div
        className="flex flex-wrap items-center gap-3 mt-2.5"
        style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}
      >
        <span>📅 Due {formatShortDate(deliveryDate)}</span>
        <span>👤 {memberCount} member{memberCount !== 1 ? "s" : ""}</span>
        <span>📎 {fileCount !== undefined ? fileCount : "—"} files</span>
        {behind && (
          <span style={{ color: "var(--color-warning)" }}>⚠ Behind schedule</span>
        )}
      </div>
    </div>
  );
}
