import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import CreateAgentForm from "@/components/CreateAgentForm";
import { getSession } from "@/lib/auth";

export default async function NewAgentPage() {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/dashboard");

  return (
    <div className="p-8">
      <Link
        href="/agents"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to agents
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Create Agent</h1>
      <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <CreateAgentForm />
      </div>
    </div>
  );
}
