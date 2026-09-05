import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LeadForm from "@/components/LeadForm";
import { getUsers } from "@/lib/db";

export default function NewLeadPage() {
  const users = getUsers().map(({ password: _, ...u }) => u);

  return (
    <div className="p-8">
      <Link
        href="/leads"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Add New Lead</h1>
      <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <LeadForm users={users} />
      </div>
    </div>
  );
}
