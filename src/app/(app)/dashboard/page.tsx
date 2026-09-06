import Link from "next/link";
import { Plus } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import StatCard from "@/components/StatCard";
import WonLostCard from "@/components/WonLostCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import BarChart from "@/components/BarChart";
import {
  labelForSource,
  labelForVisaType,
  labelForStatus,
  statusColor,
  DASHBOARD_SOURCES,
} from "@/lib/constants";
import { getSession } from "@/lib/auth";
import { getDashboardStats } from "@/lib/crm";
import {
  Users,
  TrendingUp,
  CalendarClock,
  AlertCircle,
  Inbox,
  Phone,
  UserCheck,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  const stats = await getDashboardStats(session!);
  const todayStart = startOfDay(new Date());

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Track leads, follow-ups, and conversions
            {session!.role === "agent" ? " (your assigned leads)" : ""}
          </p>
        </div>
        <Link
          href="/enquiries/new"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Enquiry
        </Link>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        <StatCard label="Total Leads" value={stats.totalLeads} icon={Users} href="/leads" />
        <StatCard
          label="New Enquiries"
          value={stats.newEnquiries}
          icon={Inbox}
          accent="text-violet-600 bg-violet-50"
          href="/leads?status=new"
        />
        <StatCard
          label="Due Today"
          value={stats.followUpsDueToday}
          icon={Phone}
          accent="text-amber-600 bg-amber-50"
          href="/follow-ups#due-today"
        />
        <StatCard
          label="Overdue"
          value={stats.followUpsOverdue}
          icon={AlertCircle}
          accent="text-red-600 bg-red-50"
          href="/follow-ups#overdue"
        />
        <WonLostCard wonCount={stats.wonCount} lostCount={stats.lostCount} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:max-w-xl">
        <StatCard
          label="This Week"
          value={stats.leadsThisWeek}
          icon={TrendingUp}
          accent="text-emerald-600 bg-emerald-50"
          href="/leads?period=week"
        />
        <StatCard
          label="This Month"
          value={stats.leadsThisMonth}
          icon={CalendarClock}
          accent="text-blue-600 bg-blue-50"
          href="/leads?period=month"
        />
        {session!.role === "admin" && (
          <StatCard
            label="Active Agents"
            value={stats.activeAgents}
            icon={UserCheck}
            accent="text-teal-600 bg-teal-50"
            href="/agents"
          />
        )}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <BarChart
          title="Leads by Source"
          data={stats.bySource}
          labelFn={labelForSource}
          order={DASHBOARD_SOURCES.map((s) => s.value)}
          color="bg-indigo-500"
        />
        <BarChart
          title="Leads by Visa Type"
          data={stats.byVisaType}
          labelFn={labelForVisaType}
          color="bg-emerald-500"
        />
        <BarChart
          title="Leads by Status"
          data={stats.byStatus}
          labelFn={labelForStatus}
          color="bg-amber-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Follow-ups Due</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.dueFollowUps.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No follow-ups due</p>
            )}
            {stats.dueFollowUps.map((lead) => {
              const overdue = lead.next_follow_up_at
                ? isBefore(new Date(lead.next_follow_up_at), todayStart)
                : false;
              return (
                <div key={lead.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-sm font-medium text-slate-900 hover:text-indigo-600"
                    >
                      {lead.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {labelForVisaType(lead.visa_type)} ·{" "}
                      {lead.next_follow_up_at
                        ? format(new Date(lead.next_follow_up_at), "dd MMM, h:mm a")
                        : ""}
                      {overdue && (
                        <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-red-700">
                          Overdue
                        </span>
                      )}
                    </p>
                  </div>
                  <WhatsAppButton phone={lead.phone} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent Leads</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <Link
                    href={`/leads/${lead.id}`}
                    className="text-sm font-medium text-slate-900 hover:text-indigo-600"
                  >
                    {lead.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {labelForSource(lead.source)} · {format(new Date(lead.created_at), "dd MMM yyyy")}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(lead.status)}`}>
                  {labelForStatus(lead.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
