import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EnquiryForm from "@/components/EnquiryForm";
import { getSession } from "@/lib/auth";
import { getUsers, stripPassword } from "@/lib/crm";

export default async function NewEnquiryPage() {
  const session = await getSession();
  const users = (await getUsers(session!)).map(stripPassword);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="p-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">New Enquiry</h1>
      <div className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <EnquiryForm users={users} defaultDate={today} />
      </div>
    </div>
  );
}
