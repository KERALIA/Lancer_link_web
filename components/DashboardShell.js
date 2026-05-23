"use client";

import DashboardTopNav from "@/components/DashboardTopNav";

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} props.userEmail
 * @param {'client'|'admin'} props.role
 * @param {boolean} [props.showAdminPanel]
 */
export default function DashboardShell({
  children,
  userEmail,
  role,
  showAdminPanel = false,
}) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--color-bg-secondary)" }}>
      <DashboardTopNav userEmail={userEmail} role={role} showAdminPanel={showAdminPanel} />
      <main className="flex-1 w-full">
        <div className="max-w-[1280px] mx-auto p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
