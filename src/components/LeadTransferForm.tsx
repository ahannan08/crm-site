"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, X } from "lucide-react";
import type { User } from "@/lib/types";
import type { LeadCountSummary } from "@/lib/lead-utils";
import type { TransferLeadType } from "@/lib/lead-utils";

const emptyCounts: LeadCountSummary = { open: 0, registered: 0, closed: 0 };

function CountBadges({ counts }: { counts: LeadCountSummary }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
        Open Leads: {counts.open}
      </span>
      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
        Registered Leads: {counts.registered}
      </span>
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
        Close Leads: {counts.closed}
      </span>
    </div>
  );
}

export default function LeadTransferForm() {
  const router = useRouter();
  const [users, setUsers] = useState<Omit<User, "password">[]>([]);
  const [fromUserId, setFromUserId] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [leadType, setLeadType] = useState<TransferLeadType>("open_registered");
  const [reason, setReason] = useState("");
  const [fromCounts, setFromCounts] = useState<LeadCountSummary>(emptyCounts);
  const [toCounts, setToCounts] = useState<LeadCountSummary>(emptyCounts);
  const [transferCount, setTransferCount] = useState(0);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const agents = users.filter((u) => u.role === "agent" && u.agent_status !== "deleted");

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []));
  }, []);

  useEffect(() => {
    if (!fromUserId) {
      setFromCounts(emptyCounts);
      setTransferCount(0);
      return;
    }
    fetch(`/api/leads/counts?user_id=${fromUserId}`)
      .then((r) => r.json())
      .then((data) => setFromCounts(data.counts ?? emptyCounts));
  }, [fromUserId]);

  useEffect(() => {
    if (!toUserId) {
      setToCounts(emptyCounts);
      return;
    }
    fetch(`/api/leads/counts?user_id=${toUserId}`)
      .then((r) => r.json())
      .then((data) => setToCounts(data.counts ?? emptyCounts));
  }, [toUserId]);

  useEffect(() => {
    if (!fromUserId) {
      setTransferCount(0);
      setServiceOptions([]);
      return;
    }
    const params = new URLSearchParams({ assigned_to: fromUserId });
    if (serviceType) params.set("service_type", serviceType);
    fetch(`/api/leads?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const leads = data.leads ?? [];
        const services = new Set<string>();
        for (const lead of leads) {
          if (lead.service_type) services.add(lead.service_type);
        }
        setServiceOptions(Array.from(services).sort());
        const filtered = leads.filter((lead: { status: string; disposition?: string }) => {
          const closed =
            lead.status === "won" ||
            lead.status === "lost" ||
            lead.disposition === "lost" ||
            lead.disposition === "converted";
          const registered = lead.status === "documents_pending" || lead.status === "applied";
          const open = !closed && !registered;
          if (leadType === "all") return true;
          if (leadType === "open_registered") return open || registered;
          if (leadType === "open") return open;
          if (leadType === "registered") return registered;
          return false;
        });
        setTransferCount(filtered.length);
      });
  }, [fromUserId, serviceType, leadType]);

  async function handleTransfer() {
    setError("");
    if (!fromUserId || !toUserId || !reason.trim()) {
      setError("Please fill all required fields.");
      return;
    }
    if (fromUserId === toUserId) {
      setError("Source and destination users must be different.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/leads/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        service_type: serviceType || undefined,
        lead_type: leadType,
        reason: reason.trim(),
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Transfer failed");
      return;
    }

    alert(`${data.transferred} lead(s) transferred successfully.`);
    router.push("/leads");
    router.refresh();
  }

  const selectClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Lead Transfer</h1>
        <p className="text-sm text-slate-500">Move leads between assigned agents</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
          <div className="rounded-lg border border-slate-200 p-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              * Assigned User (From)
            </label>
            <select
              value={fromUserId}
              onChange={(e) => setFromUserId(e.target.value)}
              className={selectClass}
            >
              <option value="">Select From Lead Assigned User</option>
              {agents.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <p className="mt-4 text-sm font-medium text-slate-700">User&apos;s Total Lead Count</p>
            <CountBadges counts={fromCounts} />
          </div>

          <div className="flex items-center justify-center pt-8">
            <ArrowLeftRight className="h-8 w-8 text-indigo-400" />
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">* To User</label>
            <select
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              className={selectClass}
            >
              <option value="">Select User</option>
              {agents.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <p className="mt-4 text-sm font-medium text-slate-700">
              Receiving User&apos;s Total Lead Count
            </p>
            <CountBadges counts={toCounts} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">* Select Lead Type</label>
            <select
              value={leadType}
              onChange={(e) => setLeadType(e.target.value as TransferLeadType)}
              className={selectClass}
            >
              <option value="open_registered">Open + Registered Leads</option>
              <option value="open">Open Leads Only</option>
              <option value="registered">Registered Leads Only</option>
              <option value="all">All Leads</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Select Service
            </label>
            <input
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              list="service-suggestions"
              placeholder="--- All Services ---"
              className={selectClass}
            />
            <datalist id="service-suggestions">
              {serviceOptions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Total No. of Leads
            </label>
            <p className="rounded-lg border border-slate-200 px-3 py-2 text-lg font-semibold text-red-600">
              {transferCount}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">* Filter Type</label>
            <select className={selectClass} defaultValue="all">
              <option value="all">All (Latest &amp; Old) Leads</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            * Enter Reason to Transfer
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={handleTransfer}
            disabled={loading || transferCount === 0}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <ArrowLeftRight className="h-4 w-4" />
            {loading ? "Transferring..." : "Transfer"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/leads")}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
