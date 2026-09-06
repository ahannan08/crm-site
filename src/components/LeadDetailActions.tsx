"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import EnquiryForm from "@/components/EnquiryForm";
import { LEAD_STATUSES, labelForStatus, statusColor } from "@/lib/constants";
import type { Lead, LeadStatus, User } from "@/lib/types";

interface LeadDetailActionsProps {
  lead: Lead;
  users: Omit<User, "password">[];
}

export default function LeadDetailActions({ lead, users }: LeadDetailActionsProps) {
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [statusLoading, setStatusLoading] = useState(false);

  async function handleStatusChange(newStatus: LeadStatus) {
    setStatusLoading(true);
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setStatus(newStatus);
      router.refresh();
    }
    setStatusLoading(false);
  }

  function handleEditSuccess() {
    setShowEditForm(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(status)}`}>
          {labelForStatus(status)}
        </span>
        <select
          value={status}
          disabled={statusLoading}
          onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
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
