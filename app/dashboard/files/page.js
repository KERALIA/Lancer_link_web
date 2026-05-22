import { getDashboardAuth } from "@/lib/auth";
import FilesClient from "@/app/dashboard/files/FilesClient";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  const auth = await getDashboardAuth();
  const userEmail = auth?.user?.email ?? "";
  const role = auth?.role ?? "client";

  return <FilesClient userEmail={userEmail} role={role} />;
}
