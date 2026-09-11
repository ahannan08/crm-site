"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Phone, Mail, MessageSquare, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import {
  LEAD_SOURCES,
  DISPOSITIONS,
  labelForServiceType,
  labelForSource,
  labelForDisposition,
  dispositionColor,
  isLeadClosed,
} from "@/lib/constants";
import type { Lead, User } from "@/lib/types";

type EnquiryView = "active" | "follow_up" | "closed" | "all";

export default function EnquiriesList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<Omit<User, "password">[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<EnquiryView>("active");
  const [assignedTo, setAssignedTo] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (assignedTo) params.set("assigned_to", assignedTo);
    if (serviceType) params.set("service_type", serviceType);
    if (followUp) params.set("follow_up", followUp);
    if (source) params.set("source", source);
    if (search) params.set("search", search);

    setLoading(true);
    fetch(`/api/leads?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLeads(data.leads ?? []);
        setUsers(data.users ?? []);
        setLoading(false);
      });
  }, [assignedTo, serviceType, followUp, source, search]);

  const serviceOptions = useMemo(() => {
    const values = new Set<string>();
    for (const lead of leads) {
      if (lead.service_type) values.add(lead.service_type);
    }
    return Array.from(values).sort();
  }, [leads]);

  const agents = users.filter((u) => u.role === "agent");

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (view === "active") return !isLeadClosed(lead);
      if (view === "closed") return isLeadClosed(lead);
      if (view === "follow_up") {
        return (
          !isLeadClosed(lead) &&
          (lead.disposition === "follow_up" ||
            lead.disposition === "meeting_booked" ||
            Boolean(lead.next_follow_up_at))
        );
      }
      return true;
    });
  }, [leads, view]);

  function getAgentName(id: string | null) {
    if (!id) return "Unassigned";
    return users.find((u) => u.id === id)?.name ?? "—";
  }

  const viewPills: { value: EnquiryView; label: string; color: string }[] = [
    { value: "active", label: "Active Enquiries", color: "border-green-200 bg-green-50 text-green-700" },
    { value: "follow_up", label: "Follow-up Enquiries", color: "border-purple-200 bg-purple-50 text-purple-700" },
    { value: "closed", label: "Closed Enquiries", color: "border-red-200 bg-red-50 text-red-700" },
    { value: "all", label: "All Enquiries", color: "border-slate-200 bg-slate-50 text-slate-700" },
  ];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enquiry</h1>
          <p className="text-sm text-slate-500">{filteredLeads.length} enquiries</p>
        </div>
        <Link
          href="/enquiries/new"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Enquiry
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {viewPills.map((pill) => (
          <button
            key={pill.value}
            type="button"
            onClick={() => setView(pill.value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              view === pill.value ? pill.color : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Select Assigned to User</option>
          {agents.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <select
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Select Services</option>
          {serviceOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Follow Up</option>
          <option value="scheduled">Scheduled</option>
          <option value="due">Due Now</option>
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Enquiry Source</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-400">Loading enquiries...</p>
      ) : filteredLeads.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-400">No enquiries found</p>
      ) : (
        <div className="space-y-4">
          <div className="hidden rounded-t-lg border border-slate-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-800 lg:grid lg:grid-cols-[1.2fr_1.4fr_1fr_auto] lg:gap-4">
            <span>Client Details</span>
            <span>Enquiry Details</span>
            <span>Follow Up Assigned User</span>
            <span className="text-right">Actions</span>
          </div>

          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="grid gap-4 p-4 lg:grid-cols-[1.2fr_1.4fr_1fr_auto] lg:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 lg:hidden">
                    Client Details
                  </p>
                  <Link
                    href={`/leads/${lead.id}`}
                    className="text-base font-semibold text-indigo-600 hover:underline"
                  >
                    {lead.name}
                  </Link>
                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                    <p className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {lead.phone}
                    </p>
                    {lead.email && (
                      <p className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {lead.email}
                      </p>
                    )}
                    <p className="text-xs text-slate-400">
                      {format(new Date(lead.enquiry_date), "dd-MM-yyyy h:mm a")}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 lg:hidden">
                    Enquiry Details
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {labelForServiceType(lead)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Staff: {getAgentName(lead.assigned_to)}
                  </p>
                  <p className="text-sm text-slate-600">
                    Source: {labelForSource(lead.source)}
                    {lead.city ? ` · ${lead.city}` : ""}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${dispositionColor(lead.disposition)}`}
                  >
                    {labelForDisposition(lead.disposition)}
                  </span>
                  {lead.notes && (
                    <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 line-clamp-2">
                      {lead.notes}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 lg:hidden">
                    Follow Up Assigned User
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {getAgentName(lead.assigned_to)}
                  </p>
                  <p className="mt-1 text-sm">
                    {lead.next_follow_up_at ? (
                      <span className="font-medium text-red-600">
                        {format(new Date(lead.next_follow_up_at), "dd-MM-yyyy h:mm a")}
                      </span>
                    ) : (
                      <span className="text-slate-400">No follow-up scheduled</span>
                    )}
                  </p>
                </div>

                <div className="flex items-start justify-end gap-2">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                    title="View lead"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/leads/transfer"
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                    title="Transfer"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
