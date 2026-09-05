interface BarChartProps {
  title: string;
  data: Record<string, number>;
  labelFn?: (key: string) => string;
  color?: string;
}

export default function BarChart({
  title,
  data,
  labelFn = (k) => k,
  color = "bg-indigo-500",
}: BarChartProps) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-400">No data yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>
      <div className="space-y-3">
        {entries.map(([key, value]) => (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-600">{labelFn(key)}</span>
              <span className="font-medium text-slate-900">{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
