"use client";

import { useState, useEffect } from "react";

/**
 * Toast — bottom-right notification with auto-dismiss.
 *
 * @param {"success"|"error"} type
 * @param {string} message
 * @param {() => void} onClose
 */
export default function Toast({ type = "success", message, onClose }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const cleanup = setTimeout(() => onClose?.(), 300);
    return () => clearTimeout(cleanup);
  }, [exiting, onClose]);

  const isSuccess = type === "success";

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] w-[320px] px-4 py-3 rounded-md text-sm ${
        exiting ? "animate-toast-slide-down" : "animate-toast-slide-up"
      }`}
      style={{
        background: isSuccess
          ? "var(--color-success-soft)"
          : "var(--color-danger-soft)",
        color: isSuccess
          ? "var(--color-success-text)"
          : "var(--color-danger-text)",
        borderLeft: `3px solid ${isSuccess ? "var(--color-success)" : "var(--color-danger)"}`,
        fontSize: 13,
      }}
      role="status"
    >
      {message}
    </div>
  );
}
