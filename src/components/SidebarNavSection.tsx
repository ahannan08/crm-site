"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, type LucideIcon } from "lucide-react";
import type { NavSubItem } from "@/lib/document-nav";

function NavIcon({ icon: Icon, filled }: { icon: LucideIcon; filled?: boolean }) {
  if (filled) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white">
        <Icon className="h-4 w-4" />
      </span>
    );
  }

  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center text-current">
      <Icon className="h-4 w-4" />
    </span>
  );
}

function navItemClass(active: boolean) {
  return `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    active
      ? "bg-indigo-100 text-indigo-700"
      : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
  }`;
}

export default function SidebarNavSection({
  label,
  icon,
  filled,
  subItems,
  sectionActive,
  pathname,
}: {
  label: string;
  icon: LucideIcon;
  filled?: boolean;
  subItems: NavSubItem[];
  sectionActive: boolean;
  pathname: string;
}) {
  const [expanded, setExpanded] = useState(sectionActive);

  useEffect(() => {
    if (sectionActive) setExpanded(true);
  }, [sectionActive]);

  return (
    <div className={`${sectionActive ? "rounded-lg bg-indigo-100/60" : ""} ${expanded ? "mb-2" : ""}`}>
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className={navItemClass(sectionActive)}
      >
        <NavIcon icon={icon} filled={filled} />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <ul className="ml-3 space-y-0.5 border-l border-indigo-200/70 py-2 pl-3">
          {subItems.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-start gap-2 rounded-md py-2 pr-2 text-[13px] leading-snug transition-colors ${
                    active
                      ? "font-semibold text-indigo-700"
                      : "font-normal text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full ${
                      active ? "bg-indigo-600" : "bg-slate-400"
                    }`}
                  />
                  <span className="min-w-0 flex-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
