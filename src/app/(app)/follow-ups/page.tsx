import Link from "next/link";
import { Phone, AlertCircle } from "lucide-react";
import { format, isBefore, startOfDay, endOfDay } from "date-fns";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getSession } from "@/lib/auth";
import { getLeads } from "@/lib/db";
import { labelForVisaType, labelForStatus, statusColor } from "@/lib/constants";

export default async function FollowUpsPage() {
  const session = await getSession();
  const allLeads = getLeads(session!.role === "agent" ? { mine: session!.id } : {});
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const activeLeads = allLeads.filter((l) => l.status !== "won" && l.status !== "lost");

  const dueToday = activeLeads.filter((l) => {
    if (!l.next_follow_up_at) return false;
    const d = new Date(l.next_follow_up_at);
    return d >= todayStart && d <= todayEnd;
  });

  const overdue = activeLeads.filter((l) => {
    if (!l.next_follow_up_at) return false;
    return isBefore(new Date(l.next_follow_up_at), todayStart);
  });

  const upcoming = activeLeads.filter((l) => {
    if (!l.next_follow_up_at) return false;
    return new Date(l.next_follow_up_at) > todayEnd;
  }).sort(
    (a, b) =>
      new Date(a.next_follow_up_at!).getTime() - new Date(b.next_follow_up_at!).getTime()
  );

  function LeadRow({ lead, badge }: { lead: typeof allLeads[0]; badge?: string }) {
    return (
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <Link
            href={`/leads/${lead.id}`}
            className="text-sm font-medium text-slate-900 hover:text-indigo-600"
          >
            {lead.name}
          </Link>
          <p className="mt-0.5 text-xs text-slate-500">
            {labelForVisaType(lead.visa_type)} · {lead.phone}
            {lead.next_follow_up_at && (
              <> · {format(new Date(lead.next_follow_up_at), "dd MMM, h:mm a")}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {badge}
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(lead.status)}`}>
            {labelForStatus(lead.status)}
          </span>
          <WhatsAppButton phone={lead.phone} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Follow-ups</h1>
        <p className="text-sm text-slate-500">Your call list for today and overdue items</p>
      </div>

      <div className="space-y-6">
        <section id="overdue" className="rounded-xl border border-red-200 bg-white shadow-sm scroll-mt-8">
          <div className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-5 py-3">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <h2 className="text-sm font-semibold text-red-800">
              Overdue ({overdue.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {overdue.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-400">No overdue follow-ups</p>
            ) : (
              overdue.map((lead) => <LeadRow key={lead.id} lead={lead} badge="Overdue" />)
            )}
          </div>
        </section>

        <section id="due-today" className="rounded-xl border border-amber-200 bg-white shadow-sm scroll-mt-8">
          <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-5 py-3">
            <Phone className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-800">
              Due Today ({dueToday.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {dueToday.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-400">No follow-ups due today</p>
            ) : (
              dueToday.map((lead) => <LeadRow key={lead.id} lead={lead} />)
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Upcoming ({upcoming.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {upcoming.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-400">No upcoming follow-ups</p>
            ) : (
              upcoming.map((lead) => <LeadRow key={lead.id} lead={lead} />)
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
