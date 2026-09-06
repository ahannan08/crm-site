import Link from "next/link";
import { Trophy, XCircle } from "lucide-react";

interface WonLostCardProps {
  wonCount: number;
  lostCount: number;
}

export default function WonLostCard({ wonCount, lostCount }: WonLostCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
      <p className="text-xs text-slate-500">Won / Lost</p>
      <div className="mt-0.5 flex items-center gap-2">
        <Link
          href="/leads?status=won"
          className="flex items-center gap-1 text-lg font-bold leading-tight text-green-600 transition-colors hover:text-green-700"
        >
          <Trophy className="h-3.5 w-3.5" /> {wonCount}
        </Link>
        <span className="text-slate-300">/</span>
        <Link
          href="/leads?status=lost"
          className="flex items-center gap-1 text-lg font-bold leading-tight text-red-500 transition-colors hover:text-red-600"
        >
          <XCircle className="h-3.5 w-3.5" /> {lostCount}
        </Link>
      </div>
    </div>
  );
}
