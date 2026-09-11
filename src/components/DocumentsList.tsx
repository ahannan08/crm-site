"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Search, RefreshCw, Plus } from "lucide-react";
import {
  DUMMY_DOCUMENTS,
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  ASSIGNEES,
  labelForDocumentStatus,
  documentStatusColor,
} from "@/lib/documents-data";

export default function DocumentsList() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");

  const filtered = useMemo(() => {
    return DUMMY_DOCUMENTS.filter((doc) => {
      if (typeFilter && doc.type !== typeFilter) return false;
      if (statusFilter && doc.status !== statusFilter) return false;
      if (assigneeFilter && doc.assignedTo !== assigneeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          doc.clientName.toLowerCase().includes(q) ||
          doc.documentName.toLowerCase().includes(q) ||
          doc.service.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, typeFilter, statusFilter, assigneeFilter]);

  const selectClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Document List</h1>
          <p className="text-sm text-slate-500">{filtered.length} documents</p>
        </div>
        <Link
          href="/documents/add"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Document
        </Link>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
          <option value="">Document Type</option>
          {DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="">Status</option>
          {DOCUMENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className={selectClass}>
          <option value="">Assigned To</option>
          {ASSIGNEES.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client or document..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setTypeFilter("");
              setStatusFilter("");
              setAssigneeFilter("");
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b border-indigo-100 bg-indigo-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-indigo-900">Client</th>
                <th className="px-4 py-3 text-left font-medium text-indigo-900">Document</th>
                <th className="px-4 py-3 text-left font-medium text-indigo-900">Service</th>
                <th className="px-4 py-3 text-left font-medium text-indigo-900">Type</th>
                <th className="px-4 py-3 text-left font-medium text-indigo-900">Status</th>
                <th className="px-4 py-3 text-left font-medium text-indigo-900">Assigned To</th>
                <th className="px-4 py-3 text-left font-medium text-indigo-900">Uploaded On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                    No documents match your filters
                  </td>
                </tr>
              ) : (
                filtered.map((doc, i) => (
                  <tr key={doc.id} className={i % 2 === 0 ? "bg-white" : "bg-indigo-50/30"}>
                    <td className="px-4 py-3 font-medium text-slate-900">{doc.clientName}</td>
                    <td className="px-4 py-3 text-slate-700">{doc.documentName}</td>
                    <td className="px-4 py-3 text-slate-600">{doc.service}</td>
                    <td className="px-4 py-3 text-slate-600">{doc.type}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${documentStatusColor(doc.status)}`}>
                        {labelForDocumentStatus(doc.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{doc.assignedTo}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {format(new Date(doc.uploadedOn), "dd MMM yyyy")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
