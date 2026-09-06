import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { getAgentLeads, getUserById } from "@/lib/db";
import {
  labelForSource,
  labelForStatus,
  labelForVisaType,
  statusColor,
} from "@/lib/constants";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = getUserById(id);
  if (!agent || agent.role !== "agent") notFound();

  const leads = getAgentLeads(id);

  return (
    <div className="p-8">
      <Link
        href="/agents"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to agents
      </Link>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Email</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-900">
              <Mail className="h-4 w-4 text-slate-400" />
              {agent.email}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Phone</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-900">
              <Phone className="h-4 w-4 text-slate-400" />
              {agent.phone || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Joined On</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {format(new Date(agent.joined_at), "dd MMM yyyy")}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Assigned Leads ({leads.length})
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {leads.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              No leads assigned to this agent
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Location</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Service</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Source</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Enquiry Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{lead.name}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center gap-1 text-slate-700 hover:text-green-600"
                      >
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{lead.city || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{labelForVisaType(lead.visa_type)}</td>
                    <td className="px-4 py-3 text-slate-600">{labelForSource(lead.source)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(lead.status)}`}>
                        {labelForStatus(lead.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {format(new Date(lead.enquiry_date), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`} className="text-xs text-indigo-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
