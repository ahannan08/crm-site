import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById, getAgentLeads } from "@/lib/crm";
import AgentProfileView from "@/components/AgentProfileView";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getUserById(session, session.id);
  if (!user) redirect("/login");

  const leads = await getAgentLeads(session, session.id);

  return <AgentProfileView agent={user} leads={leads} />;
}
