"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ASSIGNEES, DOCUMENT_TYPES, DOCUMENT_STATUSES } from "@/lib/documents-data";

export default function AddDocumentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push("/documents"), 1200);
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Add Document</h1>
        <p className="text-sm text-slate-500">Upload a new client document</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            Document saved (demo mode).
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Client Name *</label>
            <input name="clientName" required placeholder="e.g. Priya Sharma" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Document Name *</label>
            <input name="documentName" required placeholder="e.g. Passport Copy" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Document Type *</label>
            <select name="type" required className={inputClass} defaultValue="">
              <option value="" disabled>Select type</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Service / Visa</label>
            <input name="service" placeholder="e.g. Visitor Visa - Australia" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select name="status" defaultValue="pending" className={inputClass}>
              {DOCUMENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Assigned To</label>
            <select name="assignedTo" className={inputClass} defaultValue="">
              <option value="">Select agent</option>
              {ASSIGNEES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <textarea name="notes" rows={3} className={inputClass} placeholder="Optional notes..." />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">File Upload</label>
            <input type="file" className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100" />
            <p className="mt-1 text-xs text-slate-400">Demo only — file is not stored.</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading || success}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Document"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/documents")}
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
