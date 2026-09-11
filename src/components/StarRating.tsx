"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  name: string;
  value: number | null;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}

export default function StarRating({
  name,
  value,
  onChange,
  readOnly = false,
}: StarRatingProps) {
  const selected = value ?? 0;

  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} value={selected || ""} />
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= selected;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star === selected ? 0 : star)}
            className={`rounded p-0.5 transition-colors ${
              readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={`h-6 w-6 ${
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-slate-300"
              }`}
            />
          </button>
        );
      })}
      <span className="ml-2 text-sm text-slate-500">
        {selected > 0 ? `${selected}/5` : "Not rated"}
      </span>
    </div>
  );
}
