"use client";

import { useMemo, useState } from "react";
import { DUMMY_CHECKLIST } from "@/lib/documents-data";

export default function DocumentChecklist() {
  const [visaFilter, setVisaFilter] = useState("");

  const visaTypes = useMemo(() => {
    return Array.from(new Set(DUMMY_CHECKLIST.map((item) => item.visaType))).sort();
  }, []);

  const filtered = useMemo(() => {
    if (!visaFilter) return DUMMY_CHECKLIST;
    return DUMMY_CHECKLIST.filter((item) => item.visaType === visaFilter);
  }, [visaFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof DUMMY_CHECKLIST>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Document Checklist</h1>
          <p className="text-sm text-slate-500">Required documents by visa type</p>
        </div>
        <select
          value={visaFilter}
          onChange={(e) => setVisaFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Visa Types</option>
          {visaTypes.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {grouped.map(([category, items]) => (
          <div key={category} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-indigo-100 bg-indigo-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-indigo-900">{category}</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.visaType}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.required
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.required ? "Required" : "Optional"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
