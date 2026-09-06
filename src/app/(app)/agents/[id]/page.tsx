import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/db";
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

  const agent = getUserById(id);
  if (!agent || agent.role !== "agent") notFound();

  return (
    <AgentProfileView
      agent={agent}
      backHref="/agents"
      backLabel="Back to agents"
    />
  );
}
