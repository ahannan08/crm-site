"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StarRating from "@/components/StarRating";
import {
  DISPOSITIONS,
  DISPOSITIONS_REQUIRING_SCHEDULE,
  LEAD_SOURCES,
  MARITAL_STATUSES,
  SERVICE_TYPE_SUGGESTIONS,
  statusFromDisposition,
} from "@/lib/constants";
import type { Lead, LeadDisposition, LeadSource, MaritalStatus, User } from "@/lib/types";

interface EnquiryFormProps {
  users: Omit<User, "password">[];
  defaultDate?: string;
  leadId?: string;
  initial?: Partial<Lead>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EnquiryForm({
  users,
  defaultDate,
  leadId,
  initial,
  onSuccess,
  onCancel,
}: EnquiryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [disposition, setDisposition] = useState<LeadDisposition>(
    initial?.disposition ?? "no_answer"
  );
  const [lrScore, setLrScore] = useState<number | null>(initial?.lr_score ?? null);

  const agents = users.filter(
    (u) => (u.role === "agent" || u.role === "admin") && (u.role === "admin" || u.agent_status === "active")
  );
  const today = defaultDate ?? new Date().toISOString().split("T")[0];
  const isEdit = Boolean(leadId);
  const showSchedule = DISPOSITIONS_REQUIRING_SCHEDULE.includes(disposition);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const kidsRaw = form.get("kids") as string;
    const ageRaw = form.get("age") as string;
    const dispositionValue = form.get("disposition") as LeadDisposition;
    const scheduleRaw = form.get("next_follow_up_at") as string;
    const lrRaw = form.get("lr_score") as string;

    const body = {
      enquiry_date: form.get("enquiry_date") as string,
      assigned_to: (form.get("assigned_to") as string) || null,
      source: form.get("source") as LeadSource,
      phone: form.get("phone") as string,
      name: form.get("name") as string,
      age: ageRaw ? Number(ageRaw) : null,
      city: form.get("city") as string,
      service_type: (form.get("service_type") as string).trim(),
      disposition: dispositionValue,
      status: statusFromDisposition(dispositionValue),
      cva_score: (form.get("cva_score") as string).trim(),
      lr_score: lrRaw ? Number(lrRaw) : null,
      marital_status: (form.get("marital_status") as MaritalStatus) || "",
      kids: kidsRaw ? Number(kidsRaw) : null,
      highest_qualification: form.get("highest_qualification") as string,
      year_finished: form.get("year_finished") as string,
      passport_expiry: form.get("passport_expiry") as string,
      travel_history: form.get("travel_history") as string,
      refusals: form.get("refusals") as string,
      country_of_choice: form.get("country_of_choice") as string,
      occupation: form.get("occupation") as string,
      monthly_income: form.get("monthly_income") as string,
      savings: form.get("savings") as string,
      itr: form.get("itr") as string,
      property_details: form.get("property_details") as string,
      notes: form.get("notes") as string,
      next_follow_up_at: showSchedule && scheduleRaw
        ? new Date(scheduleRaw).toISOString()
        : null,
      whatsapp_reminders_enabled: form.get("whatsapp_reminders_enabled") === "on",
    };

    const url = isEdit ? `/api/leads/${leadId}` : "/api/leads";
    const method = isEdit ? "PATCH" : "POST";

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

    if (onSuccess) {
      onSuccess();
    } else {
      const data = await res.json();
      router.push(`/leads/${data.lead.id}`);
      router.refresh();
    }
    setLoading(false);
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">{children}</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Section title="Enquiry Details">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Date *</label>
          <input
            name="enquiry_date"
            type="date"
            required
            defaultValue={initial?.enquiry_date ?? today}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Assigned Person</label>
          <select
            name="assigned_to"
            defaultValue={initial?.assigned_to ?? ""}
            className={inputClass}
          >
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Source</label>
          <select
            name="source"
            defaultValue={initial?.source ?? "walk_in"}
            className={inputClass}
          >
            {LEAD_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Disposition</label>
          <select
            name="disposition"
            value={disposition}
            onChange={(e) => setDisposition(e.target.value as LeadDisposition)}
            className={inputClass}
          >
            {DISPOSITIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        {showSchedule && (
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              When? *
            </label>
            <input
              name="next_follow_up_at"
              type="datetime-local"
              required
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
              Send WhatsApp reminders to admin &amp; agent
            </label>
          </div>
        )}
      </Section>

      <Section title="Personal Details">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
          <input name="name" required defaultValue={initial?.name} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Mobile No. *</label>
          <input
            name="phone"
            type="tel"
            required
            defaultValue={initial?.phone}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Age</label>
          <input
            name="age"
            type="number"
            min="0"
            defaultValue={initial?.age ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
          <input name="city" defaultValue={initial?.city} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Marital Status</label>
          <select
            name="marital_status"
            defaultValue={initial?.marital_status ?? ""}
            className={inputClass}
          >
            <option value="">Select</option>
            {MARITAL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Kids</label>
          <input
            name="kids"
            type="number"
            min="0"
            defaultValue={initial?.kids ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Occupation</label>
          <input name="occupation" defaultValue={initial?.occupation} className={inputClass} />
        </div>
      </Section>

      <Section title="Visa Details">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Service Type</label>
          <input
            name="service_type"
            list="service-type-suggestions"
            placeholder="e.g. Work Permit, Student Visa"
            defaultValue={initial?.service_type ?? ""}
            className={inputClass}
          />
          <datalist id="service-type-suggestions">
            {SERVICE_TYPE_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Country of Choice</label>
          <input
            name="country_of_choice"
            defaultValue={initial?.country_of_choice}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">CVA Score</label>
          <input
            name="cva_score"
            placeholder="Free text"
            defaultValue={initial?.cva_score ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">LR (1–5)</label>
          <StarRating name="lr_score" value={lrScore} onChange={setLrScore} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">H. Qual</label>
          <input
            name="highest_qualification"
            defaultValue={initial?.highest_qualification}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Year Finished</label>
          <input name="year_finished" defaultValue={initial?.year_finished} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Passport Expiry</label>
          <input
            name="passport_expiry"
            type="date"
            defaultValue={initial?.passport_expiry}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Travel History</label>
          <textarea
            name="travel_history"
            rows={2}
            defaultValue={initial?.travel_history}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Refusals</label>
          <textarea name="refusals" rows={2} defaultValue={initial?.refusals} className={inputClass} />
        </div>
      </Section>

      <Section title="Financial Details">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Monthly Income</label>
          <input name="monthly_income" defaultValue={initial?.monthly_income} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Savings</label>
          <input name="savings" defaultValue={initial?.savings} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">ITR</label>
          <input name="itr" defaultValue={initial?.itr} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Property Details</label>
          <textarea
            name="property_details"
            rows={2}
            defaultValue={initial?.property_details}
            className={inputClass}
          />
        </div>
      </Section>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Comments</label>
        <textarea name="notes" rows={3} defaultValue={initial?.notes} className={inputClass} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : isEdit ? "Update Enquiry" : "Save Enquiry"}
        </button>
        <button
          type="button"
          onClick={() => (onCancel ? onCancel() : router.back())}
          className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
