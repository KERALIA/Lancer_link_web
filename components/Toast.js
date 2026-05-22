'use client';

import { useState, useEffect } from 'react';

/**
 * Toast — Fixed-position notification with auto-dismiss.
 *
 * @param {'success'|'error'} type    — controls colour & icon
 * @param {string}            message — text to display
 * @param {Function}          onClose — called after exit animation completes
 */
export default function Toast({ type = 'success', message, onClose }) {
  const [exiting, setExiting] = useState(false);

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // After exit animation plays, call parent onClose
  useEffect(() => {
    if (!exiting) return;

    const cleanup = setTimeout(() => {
      onClose?.();
    }, 300); // matches animate-toast-out duration

    return () => clearTimeout(cleanup);
  }, [exiting, onClose]);

  const isSuccess = type === 'success';

  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-start gap-3 bg-surface border border-border rounded-xl shadow-2xl px-5 py-4 min-w-[320px] max-w-md ${
        exiting ? 'animate-toast-out' : 'animate-toast-in'
      }`}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: isSuccess
          ? 'var(--success)'
          : 'var(--error)',
      }}
    >
      {/* Icon */}
      <span className="mt-0.5 shrink-0">
        {isSuccess ? (
          <svg className="w-5 h-5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        )}
      </span>

      {/* Message */}
      <p className="text-sm text-text-primary flex-1">{message}</p>

      {/* Close button */}
      <button
        onClick={() => setExiting(true)}
        className="shrink-0 text-text-muted hover:text-text-primary transition cursor-pointer"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
