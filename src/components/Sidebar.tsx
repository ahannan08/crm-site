"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PhoneCall,
  LogOut,
  Globe,
  UserCircle,
  Ticket,
  FileText,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import type { SessionUser } from "@/lib/types";
import {
  adminLeadSubItems,
  agentLeadSubItems,
  isLeadSectionActive,
} from "@/lib/lead-nav";
import { documentSubItems, isDocumentSectionActive } from "@/lib/document-nav";
import { calendarSubItems, isCalendarSectionActive } from "@/lib/calendar-nav";
import SidebarNavSection from "@/components/SidebarNavSection";

const adminNav = [
  { href: "/agents", label: "Agents", icon: UserCircle },
  { href: "/follow-ups", label: "Follow-ups", icon: PhoneCall },
];

const agentNav = [
  { href: "/profile", label: "My Profile", icon: UserCircle },
  { href: "/follow-ups", label: "Follow-ups", icon: PhoneCall },
];

function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
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

        <SidebarNavSection
          label="Lead"
          icon={Ticket}
          filled
          subItems={isAgent ? agentLeadSubItems : adminLeadSubItems}
          sectionActive={isLeadSectionActive(pathname)}
          pathname={pathname}
        />

        <SidebarNavSection
          label="Documents"
          icon={FileText}
          filled
          subItems={documentSubItems}
          sectionActive={isDocumentSectionActive(pathname)}
          pathname={pathname}
        />

        <SidebarNavSection
          label="Calendar"
          icon={CalendarDays}
          filled
          subItems={calendarSubItems}
          sectionActive={isCalendarSectionActive(pathname)}
          pathname={pathname}
        />

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
