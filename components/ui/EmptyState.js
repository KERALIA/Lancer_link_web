"use client";

import Button from "@/components/ui/Button";

/**
 * @param {object} props
 * @param {React.ReactNode} props.icon
 * @param {string} props.heading
 * @param {string} props.body
 * @param {string} [props.ctaLabel]
 * @param {() => void} [props.onCta]
 */
export default function EmptyState({ icon, heading, body, ctaLabel, onCta }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-4">
      <div style={{ color: "var(--color-text-tertiary)" }}>{icon}</div>
      <h3
        className="mt-3"
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: "var(--color-text-primary)",
        }}
      >
        {heading}
      </h3>
      <p
        className="mt-2 max-w-[280px]"
        style={{
          fontSize: 13,
          color: "var(--color-text-secondary)",
          lineHeight: 1.6,
        }}
      >
        {body}
      </p>
      {ctaLabel && onCta && (
        <div className="mt-5">
          <Button type="button" onClick={onCta}>
            {ctaLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
