"use client";

import { useRouter } from "next/navigation";
import { Filter } from "lucide-react";
import { AGENT_STATUS_FILTERS } from "@/lib/constants";
import type { AgentStatusFilter } from "@/lib/types";

export default function AgentsStatusFilter({ status }: { status: AgentStatusFilter }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-slate-400" />
      <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
        {AGENT_STATUS_FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              const params = new URLSearchParams();
              if (option.value !== "active") {
                params.set("status", option.value);
              }
              const query = params.toString();
              router.push(query ? `/agents?${query}` : "/agents");
            }}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              status === option.value
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
