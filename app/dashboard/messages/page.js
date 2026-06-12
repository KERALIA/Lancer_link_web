import { getDashboardAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const auth = await getDashboardAuth();

  if (!auth?.user) {
    redirect("/login");
  }

  return (
    <MessagesClient userEmail={auth.user.email} role={auth.role} />
  );
}
