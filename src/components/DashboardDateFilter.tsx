"use client";

import { useRouter } from "next/navigation";
import { CalendarRange } from "lucide-react";

interface DashboardDateFilterProps {
  from: string;
  to: string;
}

export default function DashboardDateFilter({ from, to }: DashboardDateFilterProps) {
  const router = useRouter();

  function applyRange(nextFrom: string, nextTo: string) {
    if (!nextFrom || !nextTo) return;
    router.push(`/dashboard?from=${nextFrom}&to=${nextTo}`);
  }

  const inputClass =
    "rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none";

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <CalendarRange className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <input
        type="date"
        defaultValue={from}
        className={inputClass}
        onChange={(e) => applyRange(e.target.value, to)}
        aria-label="From date"
      />
      <span>–</span>
      <input
        type="date"
        defaultValue={to}
        className={inputClass}
        onChange={(e) => applyRange(from, e.target.value)}
        aria-label="To date"
      />
    </div>
  );
}
