import { Suspense } from "react";
import EnquiriesList from "@/components/EnquiriesList";

export default function EnquiriesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-400">Loading enquiries...</div>}>
      <EnquiriesList />
    </Suspense>
  );
}
