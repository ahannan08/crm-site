"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  VISA_TYPES,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from "@/lib/constants";
import type { LeadSource, LeadStatus, User, VisaType } from "@/lib/types";

interface LeadFormProps {
  users: Omit<User, "password">[];
  initial?: Partial<{
    name: string;
    phone: string;
    email: string;
    city: string;
    visa_type: VisaType;
    source: LeadSource;
    status: LeadStatus;
    assigned_to: string | null;
    next_follow_up_at: string | null;
    whatsapp_reminders_enabled?: boolean;
    notes: string;
  }>;
  leadId?: string;
}

export default function LeadForm({ users, initial, leadId }: LeadFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const agents = users.filter(
    (u) => (u.role === "agent" || u.role === "admin") && (u.role === "admin" || u.agent_status === "active")
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      enquiry_date: (form.get("enquiry_date") as string) || new Date().toISOString().split("T")[0],
      name: form.get("name") as string,
      phone: form.get("phone") as string,
      email: form.get("email") as string,
      city: form.get("city") as string,
      visa_type: form.get("visa_type") as VisaType,
      source: form.get("source") as LeadSource,
      status: form.get("status") as LeadStatus,
      assigned_to: (form.get("assigned_to") as string) || null,
      next_follow_up_at: (form.get("next_follow_up_at") as string)
        ? new Date(form.get("next_follow_up_at") as string).toISOString()
        : null,
      whatsapp_reminders_enabled: form.get("whatsapp_reminders_enabled") === "on",
      notes: form.get("notes") as string,
    };

    const url = leadId ? `/api/leads/${leadId}` : "/api/leads";
    const method = leadId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    const data = await res.json();
    router.push(`/leads/${data.lead.id}`);
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
          <input name="name" required defaultValue={initial?.name} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Phone *</label>
          <input name="phone" required defaultValue={initial?.phone} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input name="email" type="email" defaultValue={initial?.email} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
          <input name="city" defaultValue={initial?.city} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Visa Type *</label>
          <select name="visa_type" required defaultValue={initial?.visa_type ?? "visit"} className={inputClass}>
            {VISA_TYPES.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Lead Source *</label>
          <select name="source" required defaultValue={initial?.source ?? "walk_in"} className={inputClass}>
            {LEAD_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
          <select name="status" defaultValue={initial?.status ?? "new"} className={inputClass}>
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Assigned To</label>
          <select name="assigned_to" defaultValue={initial?.assigned_to ?? ""} className={inputClass}>
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Next Follow-up</label>
          <input
            name="next_follow_up_at"
            type="datetime-local"
            defaultValue={
              initial?.next_follow_up_at
                ? new Date(initial.next_follow_up_at).toISOString().slice(0, 16)
                : ""
            }
            className={inputClass}
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="whatsapp_reminders_enabled"
              defaultChecked={initial?.whatsapp_reminders_enabled !== false}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Send WhatsApp follow-up reminders to admin &amp; assigned agent (on by default)
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={initial?.notes}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : leadId ? "Update Lead" : "Create Lead"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
