import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById, getAgentLeads } from "@/lib/crm";
import AgentProfileView from "@/components/AgentProfileView";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const { id } = await params;

  if (session?.role === "agent") {
    if (id !== session.id) {
      redirect("/profile");
    }
    redirect("/profile");
  }

  const agent = await getUserById(session!, id);
  if (!agent || agent.role !== "agent") notFound();

  const leads = await getAgentLeads(session!, id);

  return (
    <AgentProfileView
      agent={agent}
      leads={leads}
      backHref="/agents"
      backLabel="Back to agents"
    />
  );
}
