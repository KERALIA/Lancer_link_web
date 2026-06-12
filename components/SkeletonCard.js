'use client';

/**
 * SkeletonCard — Placeholder shimmer card shown while real data loads.
 *
 * @param {'default'|'wide'|'small'} variant — controls card width / bar layout
 */
export default function SkeletonCard({ variant = 'default' }) {
  /** Variant-specific wrapper classes */
  const variantClasses = {
    default: '',
    wide: 'col-span-2',
    small: 'max-w-xs',
  };

  return (
    <div
      className={`bg-surface rounded-2xl border border-border p-6 space-y-4 ${variantClasses[variant] ?? ''}`}
    >
      {/* Title bar */}
      <div className="h-4 w-3/5 bg-border-light/50 rounded animate-pulse-skeleton" />

      {/* Subtitle bar */}
      <div className="h-3 w-4/5 bg-border-light/50 rounded animate-pulse-skeleton" />

      {/* Content block — taller bar */}
      <div className="h-8 w-full bg-border-light/50 rounded animate-pulse-skeleton" />

      {/* Short trailing bar */}
      {variant !== 'small' && (
        <div className="h-3 w-2/5 bg-border-light/50 rounded animate-pulse-skeleton" />
      )}
    </div>
  );
}
