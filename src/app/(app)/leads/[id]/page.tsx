import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin } from "lucide-react";
import { format } from "date-fns";
import LeadDetailActions from "@/components/LeadDetailActions";
import ActivityLog from "@/components/ActivityLog";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getLeadById, getActivities, getUsers, getUserById } from "@/lib/db";
import {
  labelForVisaType,
  labelForSource,
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
        <WhatsAppButton phone={lead.phone} />
      </div>

      <div className="mb-6">
        <LeadDetailActions lead={lead} users={users} />
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
            <p className="text-xs text-slate-500">Location</p>
            <p className="text-sm font-medium">{lead.city || "—"}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Enquiry Details</h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Enquiry Date", lead.enquiry_date ? format(new Date(lead.enquiry_date), "dd MMM yyyy") : "—"],
            ["Age", lead.age ?? "—"],
            ["Marital Status", lead.marital_status || "—"],
            ["Kids", lead.kids ?? "—"],
            ["Occupation", lead.occupation || "—"],
            ["Country", lead.country_of_choice || "—"],
            ["H. Qualification", lead.highest_qualification || "—"],
            ["Year Finished", lead.year_finished || "—"],
            ["Passport Expiry", lead.passport_expiry ? format(new Date(lead.passport_expiry), "dd MMM yyyy") : "—"],
            ["Monthly Income", lead.monthly_income || "—"],
            ["Savings", lead.savings || "—"],
            ["ITR", lead.itr || "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="text-sm font-medium text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
        {(lead.travel_history || lead.refusals || lead.property_details || lead.notes) && (
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
            {lead.travel_history && (
              <div>
                <p className="text-xs text-slate-500">Travel History</p>
                <p className="text-sm text-slate-900">{lead.travel_history}</p>
              </div>
            )}
            {lead.refusals && (
              <div>
                <p className="text-xs text-slate-500">Refusals</p>
                <p className="text-sm text-slate-900">{lead.refusals}</p>
              </div>
            )}
            {lead.property_details && (
              <div>
                <p className="text-xs text-slate-500">Property Details</p>
                <p className="text-sm text-slate-900">{lead.property_details}</p>
              </div>
            )}
            {lead.notes && (
              <div>
                <p className="text-xs text-slate-500">Comments</p>
                <p className="text-sm text-slate-900">{lead.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {lead.next_follow_up_at && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Next follow-up: {format(new Date(lead.next_follow_up_at), "dd MMM yyyy, h:mm a")}
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Activity Log</h2>
        <ActivityLog leadId={lead.id} activities={activities} />
      </div>
    </div>
  );
}
