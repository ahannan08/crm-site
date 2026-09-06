import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import AgentProfileView from "@/components/AgentProfileView";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = getUserById(session.id);
  if (!user) redirect("/login");

  return <AgentProfileView agent={user} />;
}
