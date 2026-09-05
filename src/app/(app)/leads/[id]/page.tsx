import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin } from "lucide-react";
import { format } from "date-fns";
import LeadForm from "@/components/LeadForm";
import ActivityLog from "@/components/ActivityLog";
import { getLeadById, getActivities, getUsers, getUserById } from "@/lib/db";
import {
  labelForVisaType,
  labelForSource,
  labelForStatus,
  statusColor,
} from "@/lib/constants";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = getLeadById(id);
  if (!lead) notFound();

  const users = getUsers().map(({ password: _, ...u }) => u);
  const activities = getActivities(id).map((a) => ({
    ...a,
    user_name: getUserById(a.user_id)?.name ?? "Unknown",
  }));
  const assignedAgent = lead.assigned_to ? getUserById(lead.assigned_to) : null;

  return (
    <div className="p-8">
      <Link
        href="/leads"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(lead.status)}`}>
              {labelForStatus(lead.status)}
            </span>
            <span>{labelForVisaType(lead.visa_type)}</span>
            <span>·</span>
            <span>{labelForSource(lead.source)}</span>
            {assignedAgent && (
              <>
                <span>·</span>
                <span>Assigned to {assignedAgent.name}</span>
              </>
            )}
          </div>
        </div>
        <a
          href={`tel:${lead.phone}`}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <Phone className="h-4 w-4" />
          Call {lead.phone}
        </a>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <Phone className="h-5 w-5 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Phone</p>
            <p className="text-sm font-medium">{lead.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <Mail className="h-5 w-5 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Email</p>
            <p className="text-sm font-medium">{lead.email || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <MapPin className="h-5 w-5 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">City</p>
            <p className="text-sm font-medium">{lead.city || "—"}</p>
          </div>
        </div>
      </div>

      {lead.next_follow_up_at && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Next follow-up: {format(new Date(lead.next_follow_up_at), "dd MMM yyyy, h:mm a")}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Edit Lead</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <LeadForm
              users={users}
              leadId={lead.id}
              initial={{
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                city: lead.city,
                visa_type: lead.visa_type,
                source: lead.source,
                status: lead.status,
                assigned_to: lead.assigned_to,
                next_follow_up_at: lead.next_follow_up_at,
                notes: lead.notes,
              }}
            />
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Activity Log</h2>
          <ActivityLog leadId={lead.id} activities={activities} />
        </div>
      </div>
    </div>
  );
}
