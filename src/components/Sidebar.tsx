"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PhoneCall,
  LogOut,
  Globe,
  UserCircle,
  Ticket,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import type { SessionUser } from "@/lib/types";
import {
  adminLeadSubItems,
  agentLeadSubItems,
  isLeadSectionActive,
} from "@/lib/lead-nav";

const adminNav = [
  { href: "/agents", label: "Agents", icon: UserCircle },
  { href: "/follow-ups", label: "Follow-ups", icon: PhoneCall },
];

const agentNav = [
  { href: "/profile", label: "My Profile", icon: UserCircle },
  { href: "/follow-ups", label: "Follow-ups", icon: PhoneCall },
];

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

export default function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const isAgent = user.role === "agent";
  const navItems = isAgent ? agentNav : adminNav;
  const leadSubItems = isAgent ? agentLeadSubItems : adminLeadSubItems;
  const leadActive = isLeadSectionActive(pathname);

  const [leadExpanded, setLeadExpanded] = useState(leadActive);

  useEffect(() => {
    if (leadActive) setLeadExpanded(true);
  }, [leadActive]);

  function handleLogout() {
    window.location.href = "/api/auth/logout";
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-indigo-200 bg-indigo-50/30">
      <div className="flex items-center gap-2 border-b border-indigo-100 bg-white px-5 py-4">
        <Globe className="h-7 w-7 text-indigo-600" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Visa CRM</p>
          <p className="text-xs text-slate-500">Lead tracking</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <Link
          href="/dashboard"
          className={navItemClass(pathname === "/dashboard")}
        >
          <NavIcon icon={LayoutDashboard} />
          <span className="flex-1">Dashboard</span>
        </Link>

        <div className={leadActive ? "rounded-lg bg-indigo-100/60" : ""}>
          <button
            type="button"
            onClick={() => setLeadExpanded((open) => !open)}
            className={navItemClass(leadActive)}
          >
            <NavIcon icon={Ticket} filled />
            <span className="flex-1 text-left">Lead</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform ${leadExpanded ? "rotate-180" : ""}`}
            />
          </button>

          {leadExpanded && (
            <ul className="space-y-0.5 pb-2 pt-1">
              {leadSubItems.map((item) => {
                const active = item.match(pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-md py-1.5 pl-[3.25rem] pr-3 text-sm transition-colors ${
                        active
                          ? "font-medium text-indigo-700"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          active ? "bg-indigo-600" : "bg-slate-400"
                        }`}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={navItemClass(active)}>
              <NavIcon icon={icon} />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-indigo-100 bg-white px-4 py-4">
        <div className="mb-3 px-1">
          <p className="text-sm font-medium text-slate-900">{user.name}</p>
          <p className="text-xs capitalize text-slate-500">{user.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
