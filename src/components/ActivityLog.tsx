"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, MessageSquare, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface Activity {
  id: string;
  type: string;
  description: string;
  user_name: string;
  created_at: string;
}

interface ActivityLogProps {
  leadId: string;
  activities: Activity[];
}

export default function ActivityLog({ leadId, activities: initial }: ActivityLogProps) {
  const router = useRouter();
  const [activities, setActivities] = useState(initial);
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"call" | "note" | "status_change">("call");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    const res = await fetch(`/api/leads/${leadId}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, description }),
    });

    if (res.ok) {
      const data = await res.json();
      setActivities([data.activity, ...activities]);
      setDescription("");
      router.refresh();
    }
    setLoading(false);
  }

  const typeIcons = {
    call: Phone,
    note: MessageSquare,
    status_change: RefreshCw,
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Log Activity</h3>
        <div className="flex gap-2">
          {(["call", "note", "status_change"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                type === t
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {t.replace("_", " ")}
            </button>
          ))}
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened on this call or note..."
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !description.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add Activity"}
        </button>
      </form>

      <div className="space-y-3">
        {activities.length === 0 && (
          <p className="text-sm text-slate-400">No activities logged yet.</p>
        )}
        {activities.map((a) => {
          const Icon = typeIcons[a.type as keyof typeof typeIcons] ?? MessageSquare;
          return (
            <div key={a.id} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <div className="mt-0.5 rounded-lg bg-slate-100 p-2">
                <Icon className="h-4 w-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-800">{a.description}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {a.user_name} · {format(new Date(a.created_at), "dd MMM yyyy, h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
