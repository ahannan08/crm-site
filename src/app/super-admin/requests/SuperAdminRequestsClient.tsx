"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, LogOut } from "lucide-react";
import type { RegistrationRequest } from "@/lib/types";

export default function SuperAdminRequestsClient() {
  const router = useRouter();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/super-admin/requests");
    if (!res.ok) {
      setError("Failed to load requests");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setRequests(data.requests ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActing(id);
    const res = await fetch(`/api/super-admin/requests/${id}/${action}`, { method: "POST" });
    setActing(null);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Action failed");
      return;
    }
    await load();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-7 w-7 text-indigo-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Visa CRM — Super Admin</p>
              <p className="text-xs text-slate-500">Registration requests</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-slate-500">No pending registration requests.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{req.name}</td>
                    <td className="px-4 py-3 text-slate-600">{req.email}</td>
                    <td className="px-4 py-3 text-slate-600">{req.company_name}</td>
                    <td className="px-4 py-3 text-slate-600">{req.phone || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          disabled={acting === req.id}
                          onClick={() => handleAction(req.id, "approve")}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={acting === req.id}
                          onClick={() => handleAction(req.id, "reject")}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
