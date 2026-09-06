import Link from "next/link";
import { format } from "date-fns";
import { Mail, Phone } from "lucide-react";
import { getAgents } from "@/lib/db";

export default function AgentsPage() {
  const agents = getAgents();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Agents</h1>
        <p className="text-sm text-slate-500">
          Assigned persons and the leads they handle
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {agents.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">No agents found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Full Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Phone</th>
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
        )}
      </div>
    </div>
  );
}
