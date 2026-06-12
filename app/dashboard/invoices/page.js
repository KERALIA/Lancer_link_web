import { Suspense } from "react";
import { getDashboardAuth } from "@/lib/auth";
import { mapRowToDashboardProject } from "@/lib/dashboard-map";
import InvoicesClient from "./InvoicesClient";
import DashboardSkeleton from "@/components/DashboardSkeleton";

export const dynamic = "force-dynamic";

async function InvoicesContent() {
  const auth = await getDashboardAuth();

  if (auth?.role === "admin") {
    return <InvoicesClient role="admin" userEmail={auth.user.email} />;
  }

  const project = auth?.project ? mapRowToDashboardProject(auth.project) : null;

  return (
    <InvoicesClient
      role="client"
      userEmail={auth?.user?.email}
      clientProject={auth?.project}
      projectView={project}
    />
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <InvoicesContent />
    </Suspense>
  );
}
