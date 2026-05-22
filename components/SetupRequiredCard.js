const surfaceCardStyle = {
  background: "#18181b",
  border: "1px solid #2a2a2e",
  borderRadius: "16px",
  padding: "24px",
};

function WarningIcon() {
  return (
    <svg
      className="w-8 h-8"
      style={{ color: "#f59e0b" }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

/**
 * Shown when Supabase env vars are missing or still placeholders.
 */
export default function SetupRequiredCard() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div style={surfaceCardStyle} className="p-10 text-center max-w-md">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(245,158,11,0.15)" }}
        >
          <WarningIcon />
        </div>
        <h3 className="font-sora font-semibold text-lg mb-2" style={{ color: "#f5f0e8" }}>
          Setup required
        </h3>
        <p className="text-sm" style={{ color: "#71717a" }}>
          Add your Supabase credentials to .env.local to enable live data. See .env.example for
          the required variables.
        </p>
      </div>
    </div>
  );
}
