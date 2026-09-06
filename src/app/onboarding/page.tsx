"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [prefill, setPrefill] = useState({ name: "", email: "", company_name: "" });
  const [form, setForm] = useState({
    name: "",
    website: "",
    logo_url: "",
    description: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Missing setup token. Check your approval email for the correct link.");
      return;
    }

    fetch(`/api/onboarding?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Invalid link");
        }
        return res.json();
      })
      .then((data) => {
        setPrefill(data);
        setForm((f) => ({ ...f, name: data.company_name ?? "" }));
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        name: form.name,
        website: form.website,
        logo_url: form.logo_url,
        description: form.description,
        password: form.password,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Setup failed");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Loading setup...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 rounded-xl bg-indigo-50 p-3">
            <Globe className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Set up your company</h1>
          {prefill.email && (
            <p className="mt-1 text-sm text-slate-500">
              Welcome, {prefill.name} ({prefill.email})
            </p>
          )}
        </div>

        {error && !token ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Company name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Logo URL</label>
              <input
                type="url"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Confirm password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                minLength={8}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !token}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Setting up..." : "Complete setup"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-slate-100">
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      }
    >
      <OnboardingForm />
    </Suspense>
  );
}
