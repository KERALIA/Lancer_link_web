"use client";

import { useRouter } from "next/navigation";

const surfaceCardStyle = {
  background: "var(--color-bg-primary, #18181b)",
  border: "1px solid var(--color-border, #2a2a2e)",
  borderRadius: "16px",
  padding: "24px",
};

function RefreshIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.18-3.182"
      />
    </svg>
  );
}

export default function DashboardError({
  message = "Unable to load project data. Please check your Supabase configuration and try again.",
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div style={surfaceCardStyle} className="p-10 text-center max-w-md">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(239,68,68,0.15)" }}
        >
          <svg
            className="w-8 h-8"
            style={{ color: "#ef4444" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h3 className="font-sora font-semibold text-lg mb-2" style={{ color: "#f5f0e8" }}>
          Unable to load project data
        </h3>
        <p className="text-sm mb-6" style={{ color: "#71717a" }}>
          {message}
        </p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-white rounded-xl font-medium text-sm transition cursor-pointer bg-[#7c3aed] hover:bg-[#6d28d9]"
        >
          <RefreshIcon />
          Try Again
        </button>
      </div>
    </div>
  );
}
