import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import BulkLeadUpdate from "@/components/BulkLeadUpdate";

export default async function BulkLeadUpdatePage() {
  const session = await getSession();
  if (session?.role !== "admin") {
    redirect("/leads");
  }

  return <BulkLeadUpdate />;
}
