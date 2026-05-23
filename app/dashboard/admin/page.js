import { Suspense } from "react";
import { getDashboardAuth } from "@/lib/auth";
import AdminPageClient from "@/app/dashboard/admin/AdminPageClient";
import DashboardSkeleton from "@/components/DashboardSkeleton";

export const dynamic = "force-dynamic";

async function AdminPageContent() {
  const auth = await getDashboardAuth();
  const userEmail = auth?.user?.email ?? "";

  return <AdminPageClient userEmail={userEmail} />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AdminPageContent />
    </Suspense>
  );
}
