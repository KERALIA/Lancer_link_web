import { Suspense } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getDashboardAuth } from "@/lib/auth";
import { mapRowToDashboardProject } from "@/lib/dashboard-map";
import DashboardClient from "@/components/DashboardClient";
import DashboardSkeleton from "@/components/DashboardSkeleton";

export const dynamic = "force-dynamic";

/**
 * @param {object} props
 * @param {Promise<{ error?: string }>} props.searchParams
 */
async function DashboardContent({ searchParams }) {
  const params = await searchParams;
  const showUnauthorized = params?.error === "unauthorized";

  const auth = await getDashboardAuth();

  // Admin users go straight to the Admin Panel — no need for a client dashboard
  if (auth?.role === "admin") {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard/admin");
  }

  if (!isSupabaseConfigured()) {
    return (
      <DashboardClient
        role={auth?.role ?? "client"}
        showUnauthorized={showUnauthorized}
        setupRequired
      />
    );
  }

  if (!auth?.project) {
    return (
      <DashboardClient
        role={auth?.role ?? "client"}
        showUnauthorized={showUnauthorized}
        loadError
        errorMessage="No project found for this account. Contact your project manager."
      />
    );
  }

  const project = mapRowToDashboardProject(auth.project);

  return (
    <DashboardClient
      project={project}
      role="client"
      showUnauthorized={showUnauthorized}
      userEmail={auth?.user?.email}
    />
  );
}

/**
 * @param {object} props
 * @param {Promise<{ error?: string }>} props.searchParams
 */
export default function DashboardPage({ searchParams }) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
