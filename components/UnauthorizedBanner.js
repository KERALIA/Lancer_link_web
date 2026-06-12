"use client";

export default function UnauthorizedBanner() {
  return (
    <div
      className="mb-6 rounded-xl px-4 py-3 text-sm"
      style={{
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.35)",
        color: "#fca5a5",
      }}
      role="alert"
    >
      You don&apos;t have permission to access the Admin Panel.
    </div>
  );
}
