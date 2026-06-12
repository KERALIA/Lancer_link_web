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
      className="project-card"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="project-card-name">{name || "Untitled Project"}</span>
        <span className="project-card-pct">{pct}%</span>
      </div>
      <div className="project-card-track">
        <div
          className="project-card-fill"
          style={{ width: `${pct}%`, background: fillColor }}
        />
      </div>
      <div className="project-card-meta">
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
