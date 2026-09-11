import { FileBarChart } from "lucide-react";
import { MONTH_SHORT } from "@/lib/open-leads-stats";

interface MonthlyLeadsReportCardProps {
  byMonth: Record<string, number>;
}

function formatAxisValue(n: number): string {
  if (n >= 100000) return `${Math.round(n / 100000)},00,000`;
  if (n >= 1000) return `${Math.round(n / 1000)},000`;
  return String(n);
}

function buildYTicks(max: number): number[] {
  if (max <= 0) return [0, 1, 2, 3, 4];
  const step = max <= 5 ? 1 : max <= 20 ? 5 : Math.ceil(max / 4 / 10) * 10;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  return ticks.length > 1 ? ticks : [0, max];
}

function buildWavePath(values: number[], width: number, height: number, yMax: number): string {
  if (values.length === 0) return "";
  const stepX = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - (v / yMax) * height;
    return { x, y };
  });

  let d = `M ${points[0].x} ${height} L ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  d += ` L ${points[points.length - 1].x} ${height} Z`;
  return d;
}

export default function MonthlyLeadsReportCard({ byMonth }: MonthlyLeadsReportCardProps) {
  const months = MONTH_SHORT.map((m) => ({ label: m, value: byMonth[m] ?? 0 }));
  const values = months.map((m) => m.value);
  const maxValue = Math.max(...values, 1);
  const yTicks = buildYTicks(maxValue);
  const yMax = yTicks[yTicks.length - 1] || 1;
  const chartHeight = 220;
  const chartWidth = 600;

  const wavePath = buildWavePath(values, chartWidth, chartHeight, yMax);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <div className="rounded-lg bg-violet-100 p-2">
          <FileBarChart className="h-5 w-5 text-violet-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">Monthly Leads Report</h3>
      </div>

      <div className="px-4 pb-5 pt-4 sm:px-5">
        <div className="flex gap-2 sm:gap-3">
          <div
            className="flex shrink-0 flex-col justify-between text-right text-[10px] text-slate-400 sm:text-xs"
            style={{ height: chartHeight, width: 32 }}
          >
            {[...yTicks].reverse().map((tick) => (
              <span key={tick}>{formatAxisValue(tick)}</span>
            ))}
          </div>

          <div className="relative min-w-0 flex-1">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-auto w-full"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {yTicks.map((tick) => {
                const y = chartHeight - (tick / yMax) * chartHeight;
                return (
                  <line
                    key={tick}
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                  />
                );
              })}

              <path d={wavePath} fill="url(#waveGradient)" />

              {months.map(({ label, value }, i) => {
                const barW = chartWidth / months.length;
                const barInner = barW * 0.45;
                const x = i * barW + (barW - barInner) / 2;
                const h = value > 0 ? Math.max((value / yMax) * chartHeight, 6) : 0;
                const y = chartHeight - h;
                return (
                  <rect
                    key={label}
                    x={x}
                    y={y}
                    width={barInner}
                    height={h}
                    rx={2}
                    fill="#7c3aed"
                  />
                );
              })}
            </svg>

            <div className="mt-2 flex">
              {months.map(({ label }) => (
                <span
                  key={label}
                  className="flex-1 text-center text-[10px] text-slate-500 sm:text-xs"
                >
                  {label}
                </span>
              ))}
            </div>
            <p className="mt-1 text-center text-[10px] font-medium text-slate-400 sm:text-xs">
              Months
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
