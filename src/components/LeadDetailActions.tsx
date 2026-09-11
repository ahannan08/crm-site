"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import EnquiryForm from "@/components/EnquiryForm";
import {
  DISPOSITIONS,
  DISPOSITIONS_REQUIRING_SCHEDULE,
  dispositionColor,
  labelForDisposition,
  statusFromDisposition,
} from "@/lib/constants";
import type { Lead, LeadDisposition, User } from "@/lib/types";

interface LeadDetailActionsProps {
  lead: Lead;
  users: Omit<User, "password">[];
}

export default function LeadDetailActions({ lead, users }: LeadDetailActionsProps) {
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);
  const [disposition, setDisposition] = useState<LeadDisposition>(lead.disposition ?? "no_answer");
  const [scheduleAt, setScheduleAt] = useState(
    lead.next_follow_up_at
      ? new Date(lead.next_follow_up_at).toISOString().slice(0, 16)
      : ""
  );
  const [loading, setLoading] = useState(false);

  const showSchedule = DISPOSITIONS_REQUIRING_SCHEDULE.includes(disposition);

  async function saveDisposition() {
    setLoading(true);
    const body: Record<string, unknown> = {
      disposition,
      status: statusFromDisposition(disposition),
      next_follow_up_at:
        showSchedule && scheduleAt ? new Date(scheduleAt).toISOString() : null,
    };

    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) router.refresh();
    setLoading(false);
  }

  function handleEditSuccess() {
    setShowEditForm(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start gap-3">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${dispositionColor(disposition)}`}
          >
            {labelForDisposition(disposition)}
          </span>
          <select
            value={disposition}
            disabled={loading}
            onChange={(e) => setDisposition(e.target.value as LeadDisposition)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {DISPOSITIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          {showSchedule && (
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          )}
          <button
            onClick={saveDisposition}
            disabled={loading || (showSchedule && !scheduleAt)}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Update"}
          </button>
          {!showEditForm && (
            <button
              onClick={() => setShowEditForm(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              Edit Enquiry
            </button>
          )}
        </div>
      </div>

      {showEditForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Edit Enquiry</h2>
            <button
              onClick={() => setShowEditForm(false)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
          <EnquiryForm
            users={users}
            leadId={lead.id}
            initial={lead}
            onSuccess={handleEditSuccess}
            onCancel={() => setShowEditForm(false)}
          />
        </div>
      )}
    </div>
  );
}
