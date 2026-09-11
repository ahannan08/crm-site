import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LeadTransferForm from "@/components/LeadTransferForm";

export default async function LeadTransferPage() {
  const session = await getSession();
  if (session?.role !== "admin") {
    redirect("/leads");
  }

  return <LeadTransferForm />;
}
