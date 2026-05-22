import { getDashboardAuth } from "@/lib/auth";
import AdminPageClient from "@/app/dashboard/admin/AdminPageClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const auth = await getDashboardAuth();
  const userEmail = auth?.user?.email ?? "";

  return <AdminPageClient userEmail={userEmail} />;
}
