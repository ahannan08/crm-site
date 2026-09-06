import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: string;
  href?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = "text-indigo-600 bg-indigo-50",
  href,
}: StatCardProps) {
  const [iconColor, iconBg] = accent.split(" ");

  const content = (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold leading-tight text-slate-900">{value}</p>
      </div>
      <div className={`shrink-0 rounded-md p-1.5 ${iconBg}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
    </div>
  );

  const className =
    "block rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/30";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
