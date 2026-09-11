"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  DISPOSITIONS,
  labelForServiceType,
  labelForSource,
  labelForStatus,
} from "@/lib/constants";
import { leadCode } from "@/lib/lead-utils";
import type { Lead, User } from "@/lib/types";

export default function BulkLeadUpdate() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<Omit<User, "password">[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [serviceType, setServiceType] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [quality, setQuality] = useState("");
  const [assignee, setAssignee] = useState("");
  const [search, setSearch] = useState("");

  const [bulkDisposition, setBulkDisposition] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [bulkSource, setBulkSource] = useState("");

  function loadLeads() {
    const params = new URLSearchParams();
    if (serviceType) params.set("service_type", serviceType);
    if (status) params.set("status", status);
    if (source) params.set("source", source);
    if (assignee) params.set("assigned_to", assignee);
    if (search) params.set("search", search);

    setLoading(true);
    fetch(`/api/leads?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLeads(data.leads ?? []);
        setUsers(data.users ?? []);
        setSelected(new Set());
        setLoading(false);
      });
  }

  useEffect(() => {
    loadLeads();
  }, [serviceType, status, source, assignee, search]);

  const filteredLeads = useMemo(() => {
    if (!quality) return leads;
    const score = Number(quality);
    return leads.filter((l) => l.lr_score === score);
  }, [leads, quality]);

  const agents = users.filter((u) => u.role === "agent");

  const serviceOptions = useMemo(() => {
    const values = new Set<string>();
    for (const lead of leads) {
      if (lead.service_type) values.add(lead.service_type);
    }
    return Array.from(values).sort();
  }, [leads]);

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelected(new Set(filteredLeads.map((l) => l.id)));
    } else {
      setSelected(new Set());
    }
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function getAgentName(id: string | null) {
    if (!id) return "—";
    return users.find((u) => u.id === id)?.name ?? "—";
  }

  async function handleBulkUpdate() {
    setError("");
    setSuccess("");
    if (selected.size === 0) {
      setError("Select at least one lead.");
      return;
    }

    const body: Record<string, unknown> = { lead_ids: Array.from(selected) };
    if (bulkDisposition) body.disposition = bulkDisposition;
    if (bulkStatus) body.status = bulkStatus;
    if (bulkAssignee) body.assigned_to = bulkAssignee;
    if (bulkSource) body.source = bulkSource;

    if (!bulkDisposition && !bulkStatus && !bulkAssignee && !bulkSource) {
      setError("Choose at least one field to update.");
      return;
    }

    setUpdating(true);
    const res = await fetch("/api/leads/bulk-update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setUpdating(false);

    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }

    setSuccess(`${data.updated} lead(s) updated.`);
    setBulkDisposition("");
    setBulkStatus("");
    setBulkAssignee("");
    setBulkSource("");
    loadLeads();
  }

  const selectClass =
    "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Bulk Lead Update</h1>
        <p className="text-sm text-slate-500">Filter leads and apply batch updates</p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className={selectClass}>
          <option value="">Lead Services</option>
          {serviceOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="">Lead Status</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className={selectClass}>
          <option value="">Lead Source</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select value={quality} onChange={(e) => setQuality(e.target.value)} className={selectClass}>
          <option value="">Lead Quality</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={String(n)}>{n} Star{n > 1 ? "s" : ""}</option>
          ))}
        </select>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={selectClass}>
          <option value="">Lead Assignee</option>
          {agents.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={loadLeads}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="mb-3 text-sm font-medium text-indigo-900">
            Update {selected.size} selected lead(s)
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <select
              value={bulkDisposition}
              onChange={(e) => setBulkDisposition(e.target.value)}
              className={selectClass}
            >
              <option value="">Set Disposition</option>
              {DISPOSITIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className={selectClass}
            >
              <option value="">Set Status</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={bulkAssignee}
              onChange={(e) => setBulkAssignee(e.target.value)}
              className={selectClass}
            >
              <option value="">Set Assignee</option>
              {agents.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <select
              value={bulkSource}
              onChange={(e) => setBulkSource(e.target.value)}
              className={selectClass}
            >
              <option value="">Set Source</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleBulkUpdate}
              disabled={updating}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {updating ? "Updating..." : "Apply Update"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Loading...</p>
        ) : filteredLeads.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">No leads found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="border-b border-indigo-100 bg-indigo-50">
                <tr>
                  <th className="px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selected.size === filteredLeads.length && filteredLeads.length > 0}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-indigo-900">Lead Code</th>
                  <th className="px-3 py-3 text-left font-medium text-indigo-900">Client</th>
                  <th className="px-3 py-3 text-left font-medium text-indigo-900">Phone</th>
                  <th className="px-3 py-3 text-left font-medium text-indigo-900">Email ID</th>
                  <th className="px-3 py-3 text-left font-medium text-indigo-900">Services</th>
                  <th className="px-3 py-3 text-left font-medium text-indigo-900">Status</th>
                  <th className="px-3 py-3 text-left font-medium text-indigo-900">Source</th>
                  <th className="px-3 py-3 text-left font-medium text-indigo-900">Lead Quality</th>
                  <th className="px-3 py-3 text-left font-medium text-indigo-900">Assignee</th>
                  <th className="px-3 py-3 text-left font-medium text-indigo-900">City</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50">
                {filteredLeads.map((lead, i) => (
                  <tr
                    key={lead.id}
                    className={i % 2 === 0 ? "bg-white" : "bg-indigo-50/40"}
                  >
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(lead.id)}
                        onChange={(e) => toggleOne(lead.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-600">
                      {leadCode(lead)}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{lead.name}</td>
                    <td className="px-3 py-2.5 text-slate-600">{lead.phone}</td>
                    <td className="px-3 py-2.5 text-slate-600">{lead.email || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600">{labelForServiceType(lead)}</td>
                    <td className="px-3 py-2.5 text-slate-600">{labelForStatus(lead.status)}</td>
                    <td className="px-3 py-2.5 text-slate-600">{labelForSource(lead.source)}</td>
                    <td className="px-3 py-2.5 text-slate-600">{lead.lr_score ?? "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600">{getAgentName(lead.assigned_to)}</td>
                    <td className="px-3 py-2.5 text-slate-600">{lead.city || "—"}</td>
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
