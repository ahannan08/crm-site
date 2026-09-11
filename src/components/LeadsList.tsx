"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Search, Phone } from "lucide-react";
import {
  VISA_TYPES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  labelForServiceType,
  labelForSource,
  labelForDisposition,
  dispositionColor,
  DISPOSITIONS,
} from "@/lib/constants";
import type { Lead, User } from "@/lib/types";
import { format } from "date-fns";

export default function LeadsList() {
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<Omit<User, "password">[]>([]);
  const [search, setSearch] = useState("");
  const [visaType, setVisaType] = useState("");
  const [source, setSource] = useState("");
  const [disposition, setDisposition] = useState("");
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("agent");

  useEffect(() => {
    setDisposition(searchParams.get("disposition") ?? searchParams.get("status") ?? "");
    setPeriod(searchParams.get("period") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (visaType) params.set("visa_type", visaType);
    if (source) params.set("source", source);
    if (disposition) params.set("disposition", disposition);
    if (period) params.set("period", period);

    setLoading(true);
    fetch(`/api/leads?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLeads(data.leads);
        setUsers(data.users);
        if (data.role) setRole(data.role);
        setLoading(false);
      });
  }, [search, visaType, source, disposition, period]);

  function getAgentName(id: string | null) {
    if (!id) return "—";
    return users.find((u) => u.id === id)?.name ?? "—";
  }

  const baseTitle = role === "agent" ? "My Leads" : "Lead";
  const filterLabel =
    disposition
      ? `${DISPOSITIONS.find((d) => d.value === disposition)?.label ?? disposition}${role === "admin" ? " Leads" : ""}`
      : period === "week"
        ? "This Week"
        : period === "month"
          ? "This Month"
          : null;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {filterLabel ? (filterLabel.includes("Leads") ? filterLabel : `${filterLabel} Leads`) : baseTitle}
          </h1>
          <p className="text-sm text-slate-500">{leads.length} leads found</p>
        </div>
        <Link
          href="/enquiries/new"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Enquiry
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <select
          value={visaType}
          onChange={(e) => setVisaType(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All Visa Types</option>
          {VISA_TYPES.map((v) => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All Sources</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={disposition}
          onChange={(e) => setDisposition(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All Dispositions</option>
          {DISPOSITIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {(disposition || period) && (
          <Link
            href="/leads"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Clear filter
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Loading...</p>
        ) : leads.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">No leads found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Service</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Source</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Disposition</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Assigned</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="font-medium text-indigo-600 hover:underline">
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-slate-700 hover:text-green-600">
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{labelForServiceType(lead)}</td>
                  <td className="px-4 py-3 text-slate-600">{labelForSource(lead.source)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${dispositionColor(lead.disposition)}`}>
                      {labelForDisposition(lead.disposition)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{getAgentName(lead.assigned_to)}</td>
                  <td className="px-4 py-3 text-slate-500">{format(new Date(lead.created_at), "dd MMM yyyy")}</td>
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
  );
}
