"use client";

import Sidebar from "@/components/Sidebar";

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
    <div className="flex min-h-screen bg-background">
      <Sidebar
        userEmail={userEmail}
        role={role}
        showAdminPanel={showAdminPanel}
      />
      <main className="flex-1 lg:ml-64">
        <div className="p-6 md:p-8 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
