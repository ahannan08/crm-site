"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Globe,
  LayoutDashboard,
  LogOut,
  X,
  XCircle,
} from "lucide-react";
import type { AgencyDetail, AgencySummary } from "@/lib/agencies";
import type { RegistrationRequest, RegistrationStatus } from "@/lib/types";
import StatCard from "@/components/StatCard";

type FilterStatus = RegistrationStatus | "all";
type Tab = "requests" | "agencies";

interface DashboardData {
  metrics: {
    pending: number;
    approved: number;
    rejected: number;
    totalAgencies: number;
  };
  requests: RegistrationRequest[];
}

const STATUS_STYLES: Record<RegistrationStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

export default function SuperAdminRequestsClient() {
  const [tab, setTab] = useState<Tab>("requests");
  const [data, setData] = useState<DashboardData | null>(null);
  const [agencies, setAgencies] = useState<AgencySummary[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<AgencyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [agenciesLoading, setAgenciesLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/super-admin/dashboard");
    if (!res.ok) {
      setError("Failed to load dashboard");
      setLoading(false);
      return;
    }
    setData(await res.json());
    setLoading(false);
  }

  async function loadAgencies() {
    setAgenciesLoading(true);
    const res = await fetch("/api/super-admin/agencies");
    if (!res.ok) {
      setError("Failed to load agencies");
      setAgenciesLoading(false);
      return;
    }
    const body = await res.json();
    setAgencies(body.agencies ?? []);
    setAgenciesLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (tab === "agencies") loadAgencies();
  }, [tab]);

  function showOnboardingLink(body: { onboardingLink?: string; emailSent?: boolean }) {
    if (body.onboardingLink && !body.emailSent) {
      alert(
        `Email could not be sent (Resend sandbox only allows your own address).\n\nUse this link to complete setup locally:\n${body.onboardingLink}`
      );
    } else if (body.onboardingLink) {
      alert(`Setup link sent by email.\n\nBackup link:\n${body.onboardingLink}`);
    }
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    setActing(id);
    const res = await fetch(`/api/super-admin/requests/${id}/${action}`, { method: "POST" });
    setActing(null);
    if (!res.ok) {
      const body = await res.json();
      alert(body.error ?? "Action failed");
      return;
    }
    if (action === "approve") showOnboardingLink(await res.json());
    await loadDashboard();
  }

  async function handleResendLink(id: string) {
    setActing(id);
    const res = await fetch(`/api/super-admin/requests/${id}/resend`, { method: "POST" });
    setActing(null);
    if (!res.ok) {
      alert((await res.json()).error ?? "Failed to resend link");
      return;
    }
    showOnboardingLink(await res.json());
    await loadDashboard();
  }

  async function openAgencyDetail(id: string) {
    setDetailLoading(true);
    setSelectedAgency(null);
    const res = await fetch(`/api/super-admin/agencies/${id}`);
    setDetailLoading(false);
    if (!res.ok) {
      alert("Failed to load agency details");
      return;
    }
    const body = await res.json();
    setSelectedAgency(body.agency);
  }

  function handleLogout() {
    window.location.href = "/api/auth/logout";
  }

  const filteredRequests =
    data?.requests.filter((r) => (filter === "all" ? true : r.status === filter)) ?? [];

  const filters: { key: FilterStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-7 w-7 text-indigo-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Visa CRM — Super Admin</p>
              <p className="text-xs text-slate-500">Manage registrations & agencies</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl gap-1 px-6">
          <button
            type="button"
            onClick={() => setTab("requests")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === "requests"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Requests
          </button>
          <button
            type="button"
            onClick={() => setTab("agencies")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === "agencies"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Agencies
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        {tab === "requests" && (
          <>
            {loading ? (
              <p className="text-sm text-slate-500">Loading dashboard...</p>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : data ? (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatCard label="Pending" value={data.metrics.pending} icon={Clock} accent="text-amber-600 bg-amber-50" />
                  <StatCard label="Approved" value={data.metrics.approved} icon={CheckCircle2} accent="text-green-600 bg-green-50" />
                  <StatCard label="Rejected" value={data.metrics.rejected} icon={XCircle} accent="text-red-600 bg-red-50" />
                  <StatCard label="Active Agencies" value={data.metrics.totalAgencies} icon={Building2} accent="text-indigo-600 bg-indigo-50" />
                </div>

                <section>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">Registration requests</h2>
                    <div className="flex gap-2">
                      {filters.map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFilter(key)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            filter === key
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredRequests.length === 0 ? (
                    <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                      No {filter === "all" ? "" : filter} registration requests.
                    </p>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Company</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Submitted</th>
                            <th className="px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequests.map((req) => (
                            <tr key={req.id} className="border-b border-slate-100 last:border-0">
                              <td className="px-4 py-3 font-medium text-slate-900">{req.name}</td>
                              <td className="px-4 py-3 text-slate-600">{req.email}</td>
                              <td className="px-4 py-3 text-slate-600">{req.company_name}</td>
                              <td className="px-4 py-3 text-slate-600">{req.phone || "—"}</td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[req.status]}`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-500">{new Date(req.created_at).toLocaleDateString()}</td>
                              <td className="px-4 py-3">
                                {req.status === "pending" ? (
                                  <div className="flex gap-2">
                                    <button type="button" disabled={acting === req.id} onClick={() => handleAction(req.id, "approve")} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">Approve</button>
                                    <button type="button" disabled={acting === req.id} onClick={() => handleAction(req.id, "reject")} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                                  </div>
                                ) : req.status === "approved" ? (
                                  <button type="button" disabled={acting === req.id} onClick={() => handleResendLink(req.id)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Resend setup link</button>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            ) : null}
          </>
        )}

        {tab === "agencies" && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Agencies</h2>
            {agenciesLoading ? (
              <p className="text-sm text-slate-500">Loading agencies...</p>
            ) : agencies.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                No agencies onboarded yet.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Agency</th>
                      <th className="px-4 py-3">Admin</th>
                      <th className="px-4 py-3">Admin email</th>
                      <th className="px-4 py-3">Agents</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {agencies.map((agency) => (
                      <tr key={agency.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-medium text-slate-900">{agency.name}</td>
                        <td className="px-4 py-3 text-slate-600">{agency.admin_name}</td>
                        <td className="px-4 py-3 text-slate-600">{agency.admin_email}</td>
                        <td className="px-4 py-3 text-slate-600">{agency.agent_count}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(agency.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openAgencyDetail(agency.id)}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                          >
                            View more
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {(selectedAgency || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {detailLoading ? "Loading..." : selectedAgency?.name}
              </h3>
              <button type="button" onClick={() => setSelectedAgency(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedAgency && (
              <div className="space-y-6 px-6 py-5">
                <div className="grid gap-2 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-900">Website:</span> {selectedAgency.website || "—"}</p>
                  <p><span className="font-medium text-slate-900">Description:</span> {selectedAgency.description || "—"}</p>
                  <p><span className="font-medium text-slate-900">Created:</span> {new Date(selectedAgency.created_at).toLocaleString()}</p>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</h4>
                  {selectedAgency.admin ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                      <p className="font-medium text-slate-900">{selectedAgency.admin.name}</p>
                      <p className="text-slate-600">{selectedAgency.admin.email}</p>
                      <p className="text-slate-600">{selectedAgency.admin.phone || "—"}</p>
                      <p className="mt-1 text-xs text-slate-500">Joined {new Date(selectedAgency.admin.joined_at).toLocaleDateString()}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No admin found.</p>
                  )}
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Agents ({selectedAgency.agents.length})
                  </h4>
                  {selectedAgency.agents.length === 0 ? (
                    <p className="text-sm text-slate-500">No agents yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedAgency.agents.map((agent) => (
                        <div key={agent.id} className="rounded-lg border border-slate-200 p-4 text-sm">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-900">{agent.name}</p>
                            <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${agent.agent_status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                              {agent.agent_status ?? "active"}
                            </span>
                          </div>
                          <p className="text-slate-600">{agent.email}</p>
                          <p className="text-slate-600">{agent.phone || "—"}</p>
                          <p className="mt-1 text-xs text-slate-500">Joined {new Date(agent.joined_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
