import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SuperAdminRequestsClient from "./SuperAdminRequestsClient";

export default async function SuperAdminRequestsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "super_admin") {
    redirect("/dashboard");
  }

  return <SuperAdminRequestsClient />;
}
