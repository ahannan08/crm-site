import Link from "next/link";
import { Trophy, XCircle } from "lucide-react";

interface WonLostCardProps {
  wonCount: number;
  lostCount: number;
}

export default function WonLostCard({ wonCount, lostCount }: WonLostCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">Won / Lost</p>
      <div className="mt-1 flex items-center gap-3">
        <Link
          href="/leads?status=won"
          className="flex items-center gap-1 text-xl font-bold text-green-600 transition-colors hover:text-green-700"
        >
          <Trophy className="h-4 w-4" /> {wonCount}
        </Link>
        <span className="text-slate-300">/</span>
        <Link
          href="/leads?status=lost"
          className="flex items-center gap-1 text-xl font-bold text-red-500 transition-colors hover:text-red-600"
        >
          <XCircle className="h-4 w-4" /> {lostCount}
        </Link>
      </div>
    </div>
  );
}
