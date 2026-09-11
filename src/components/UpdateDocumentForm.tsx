"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DUMMY_DOCUMENTS,
  DOCUMENT_STATUSES,
  ASSIGNEES,
  labelForDocumentStatus,
  documentStatusColor,
  type DocumentStatus,
} from "@/lib/documents-data";

export default function UpdateDocumentForm() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(DUMMY_DOCUMENTS[0]?.id ?? "");
  const [status, setStatus] = useState<DocumentStatus>(DUMMY_DOCUMENTS[0]?.status ?? "pending");
  const [assignedTo, setAssignedTo] = useState(DUMMY_DOCUMENTS[0]?.assignedTo ?? "");
  const [notes, setNotes] = useState(DUMMY_DOCUMENTS[0]?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const selected = useMemo(
    () => DUMMY_DOCUMENTS.find((d) => d.id === selectedId),
    [selectedId]
  );

  function handleSelect(id: string) {
    setSelectedId(id);
    const doc = DUMMY_DOCUMENTS.find((d) => d.id === id);
    if (doc) {
      setStatus(doc.status);
      setAssignedTo(doc.assignedTo);
      setNotes(doc.notes ?? "");
    }
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setSuccess(true);
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Update Doc</h1>
        <p className="text-sm text-slate-500">Update status and details for an existing document</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-indigo-100 bg-indigo-50 px-4 py-3">
            <h2 className="text-sm font-semibold text-indigo-900">Select Document</h2>
          </div>
          <ul className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
            {DUMMY_DOCUMENTS.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(doc.id)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                    selectedId === doc.id ? "bg-indigo-50" : ""
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900">{doc.documentName}</p>
                  <p className="text-xs text-slate-500">{doc.clientName} · {doc.service}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${documentStatusColor(doc.status)}`}>
                    {labelForDocumentStatus(doc.status)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {success && (
            <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              Document updated (demo mode).
            </div>
          )}

          {selected ? (
            <>
              <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{selected.documentName}</p>
                <p className="text-xs text-slate-500">
                  {selected.clientName} · {selected.type} · {selected.service}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                    className={inputClass}
                  >
                    {DOCUMENT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Assigned To</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className={inputClass}
                  >
                    {ASSIGNEES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className={inputClass}
                    placeholder="Update notes..."
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Document"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/documents")}
                  className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">Select a document to update</p>
          )}
        </form>
      </div>
    </div>
  );
}
