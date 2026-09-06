"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  VISA_TYPES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  MARITAL_STATUSES,
} from "@/lib/constants";
import type { LeadSource, LeadStatus, MaritalStatus, User, VisaType } from "@/lib/types";

interface EnquiryFormProps {
  users: Omit<User, "password">[];
  defaultDate?: string;
}

export default function EnquiryForm({ users, defaultDate }: EnquiryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const agents = users.filter((u) => u.role === "agent" || u.role === "admin");
  const today = defaultDate ?? new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const kidsRaw = form.get("kids") as string;
    const ageRaw = form.get("age") as string;

    const body = {
      enquiry_date: form.get("enquiry_date") as string,
      assigned_to: (form.get("assigned_to") as string) || null,
      source: form.get("source") as LeadSource,
      phone: form.get("phone") as string,
      name: form.get("name") as string,
      age: ageRaw ? Number(ageRaw) : null,
      city: form.get("city") as string,
      visa_type: form.get("visa_type") as VisaType,
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
      status: form.get("status") as LeadStatus,
    };

    const res = await fetch("/api/leads", {
      method: "POST",
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
            defaultValue={today}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Assigned Person</label>
          <select name="assigned_to" defaultValue="" className={inputClass}>
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Source</label>
          <select name="source" defaultValue="walk_in" className={inputClass}>
            {LEAD_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Disposition</label>
          <select name="status" defaultValue="new" className={inputClass}>
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </Section>

      <Section title="Personal Details">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
          <input name="name" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Mobile No. *</label>
          <input name="phone" type="tel" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Age</label>
          <input name="age" type="number" min="0" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
          <input name="city" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Marital Status</label>
          <select name="marital_status" defaultValue="" className={inputClass}>
            <option value="">Select</option>
            {MARITAL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Kids</label>
          <input name="kids" type="number" min="0" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Occupation</label>
          <input name="occupation" className={inputClass} />
        </div>
      </Section>

      <Section title="Visa Details">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Service Type</label>
          <select name="visa_type" defaultValue="visit" className={inputClass}>
            {VISA_TYPES.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Country of Choice</label>
          <input name="country_of_choice" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">H. Qual</label>
          <input name="highest_qualification" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Year Finished</label>
          <input name="year_finished" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Passport Expiry</label>
          <input name="passport_expiry" type="date" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Travel History</label>
          <textarea name="travel_history" rows={2} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Refusals</label>
          <textarea name="refusals" rows={2} className={inputClass} />
        </div>
      </Section>

      <Section title="Financial Details">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Monthly Income</label>
          <input name="monthly_income" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Savings</label>
          <input name="savings" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">ITR</label>
          <input name="itr" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Property Details</label>
          <textarea name="property_details" rows={2} className={inputClass} />
        </div>
      </Section>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Comments</label>
        <textarea name="notes" rows={3} className={inputClass} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Enquiry"}
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
