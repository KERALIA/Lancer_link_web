"use client";

/**
 * Dashboard surface card with purple glow on hover.
 * @param {object} props
 * @param {import("react").ReactNode} props.children
 * @param {string} [props.className]
 * @param {import("react").CSSProperties} [props.style]
 */
export default function GlowCard({ children, className = "", style }) {
  return (
    <div
      className={`dashboard-glow-card animate-fade-in-up ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
