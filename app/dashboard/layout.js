import { requireDashboardAuth } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }) {
  const { user, role } = await requireDashboardAuth();

  return (
    <DashboardShell
      userEmail={user.email}
      role={role}
      showAdminPanel={role === "admin"}
    >
      {children}
    </DashboardShell>
  );
}
