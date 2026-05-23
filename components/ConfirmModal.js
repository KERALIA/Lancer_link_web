"use client";

/**
 * ConfirmModal — reusable confirmation dialog.
 *
 * @param {object} props
 * @param {string} props.message
 * @param {string} [props.confirmLabel]
 * @param {boolean} [props.destructive]
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 */
export default function ConfirmModal({
  message,
  confirmLabel = "Delete",
  destructive = true,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="p-6 max-w-sm w-full mx-4 animate-fade-in-up rounded-lg border"
        style={{
          background: "var(--color-bg-primary)",
          borderColor: "var(--color-border)",
        }}
      >
        <p
          className="text-sm mb-6"
          style={{ color: "var(--color-text-primary)" }}
        >
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 h-9 rounded-md text-sm transition cursor-pointer border"
            style={{
              color: "var(--color-text-primary)",
              borderColor: "var(--color-border)",
              background: "transparent",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 h-9 rounded-md text-sm font-medium transition cursor-pointer"
            style={
              destructive
                ? {
                    background: "var(--color-danger-soft)",
                    color: "var(--color-danger-text)",
                  }
                : {
                    background: "var(--color-brand)",
                    color: "#fff",
                  }
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
