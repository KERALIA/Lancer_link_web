import { requireDashboardAuth } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

export const dynamic = "force-dynamic";

// ─── Private Route — Block All Crawlers ───────────────────────────────────────
// The dashboard is behind authentication. Any bot that reaches this route
// would hit an auth redirect loop, wasting crawl budget and polluting the
// Search Console index with private URLs. We block at the metadata layer
// before robots.ts even gets involved.
export const metadata = {
  title: "Workspace",           // Shows as "Workspace | LancerLink" via template
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

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
