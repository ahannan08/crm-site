import { Suspense } from "react";
import LeadsList from "@/components/LeadsList";

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-400">Loading leads...</div>}>
      <LeadsList />
    </Suspense>
  );
}
