import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Mail, Phone, Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getAgents } from "@/lib/crm";
import { agentStatusColor, labelForAgentStatus } from "@/lib/constants";
import AgentsStatusFilter from "@/components/AgentsStatusFilter";
import type { AgentStatusFilter } from "@/lib/types";

function parseStatusFilter(value?: string): AgentStatusFilter {
  if (value === "inactive" || value === "deleted" || value === "all") return value;
  return "active";
}

function formatLastLogin(value?: string | null) {
  if (!value) return "—";
  return format(new Date(value), "dd MMM yyyy, h:mm a");
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (session?.role === "agent") {
    redirect("/profile");
  }

  const params = await searchParams;
  const statusFilter = parseStatusFilter(params.status);
  const agents = await getAgents(session!, statusFilter);

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agents</h1>
          <p className="text-sm text-slate-500">
            Assigned persons and the leads they handle
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <AgentsStatusFilter status={statusFilter} />
          <Link
            href="/agents/new"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Create Agent
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {agents.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">No agents found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Full Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Designation</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Last Login</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Joined On</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Leads</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/agents/${agent.id}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {agent.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{agent.designation || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-slate-600">
                        <Mail className="h-3 w-3" />
                        {agent.email}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {agent.phone ? (
                        <a
                          href={`tel:${agent.phone}`}
                          className="flex items-center gap-1 text-slate-600 hover:text-green-600"
                        >
                          <Phone className="h-3 w-3" />
                          {agent.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${agentStatusColor(agent.agent_status ?? "active")}`}
                      >
                        {labelForAgentStatus(agent.agent_status ?? "active")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatLastLogin(agent.last_login_at)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {format(new Date(agent.joined_at), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{agent.leadCount}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/agents/${agent.id}`}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        View leads
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
