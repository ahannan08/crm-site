import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import {
  startOfWeek,
  startOfMonth,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
} from "date-fns";
import type {
  Activity,
  ActivityType,
  DashboardStats,
  Database,
  Lead,
  LeadSource,
  LeadStatus,
  User,
  VisaType,
} from "./types";

const DATA_DIR = join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "db.json");
const SEED_PATH = join(DATA_DIR, "seed.json");

function ensureDb(): Database {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(DB_PATH)) {
    copyFileSync(SEED_PATH, DB_PATH);
  }
  return JSON.parse(readFileSync(DB_PATH, "utf-8")) as Database;
}

function saveDb(db: Database): void {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getUsers(): User[] {
  return ensureDb().users;
}

export function getUserByEmail(email: string): User | undefined {
  return ensureDb().users.find((u) => u.email === email);
}

export function getUserById(id: string): User | undefined {
  return ensureDb().users.find((u) => u.id === id);
}

export interface LeadFilters {
  visa_type?: VisaType;
  source?: LeadSource;
  status?: LeadStatus;
  assigned_to?: string;
  search?: string;
  mine?: string;
}

export function getLeads(filters: LeadFilters = {}): Lead[] {
  const db = ensureDb();
  let leads = [...db.leads];

  if (filters.mine) {
    leads = leads.filter((l) => l.assigned_to === filters.mine);
  }
  if (filters.visa_type) {
    leads = leads.filter((l) => l.visa_type === filters.visa_type);
  }
  if (filters.source) {
    leads = leads.filter((l) => l.source === filters.source);
  }
  if (filters.status) {
    leads = leads.filter((l) => l.status === filters.status);
  }
  if (filters.assigned_to) {
    leads = leads.filter((l) => l.assigned_to === filters.assigned_to);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    leads = leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q)
    );
  }

  return leads.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getLeadById(id: string): Lead | undefined {
  return ensureDb().leads.find((l) => l.id === id);
}

export interface CreateLeadInput {
  name: string;
  phone: string;
  email: string;
  city: string;
  visa_type: VisaType;
  source: LeadSource;
  status?: LeadStatus;
  assigned_to?: string | null;
  next_follow_up_at?: string | null;
  notes?: string;
}

export function createLead(input: CreateLeadInput): Lead {
  const db = ensureDb();
  const now = new Date().toISOString();
  const lead: Lead = {
    id: randomUUID(),
    name: input.name,
    phone: input.phone,
    email: input.email,
    city: input.city,
    visa_type: input.visa_type,
    source: input.source,
    status: input.status ?? "new",
    assigned_to: input.assigned_to ?? null,
    next_follow_up_at: input.next_follow_up_at ?? null,
    notes: input.notes ?? "",
    created_at: now,
    updated_at: now,
  };
  db.leads.push(lead);
  saveDb(db);
  return lead;
}

export interface UpdateLeadInput {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  visa_type?: VisaType;
  source?: LeadSource;
  status?: LeadStatus;
  assigned_to?: string | null;
  next_follow_up_at?: string | null;
  notes?: string;
}

export function updateLead(id: string, input: UpdateLeadInput): Lead | null {
  const db = ensureDb();
  const index = db.leads.findIndex((l) => l.id === id);
  if (index === -1) return null;

  db.leads[index] = {
    ...db.leads[index],
    ...input,
    updated_at: new Date().toISOString(),
  };
  saveDb(db);
  return db.leads[index];
}

export function getActivities(leadId: string): Activity[] {
  return ensureDb()
    .activities.filter((a) => a.lead_id === leadId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

export function createActivity(
  leadId: string,
  userId: string,
  type: ActivityType,
  description: string
): Activity {
  const db = ensureDb();
  const activity: Activity = {
    id: randomUUID(),
    lead_id: leadId,
    user_id: userId,
    type,
    description,
    created_at: new Date().toISOString(),
  };
  db.activities.push(activity);
  saveDb(db);
  return activity;
}

export function getDashboardStats(userId?: string, role?: string): DashboardStats {
  const allLeads = getLeads(role === "agent" && userId ? { mine: userId } : {});
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const bySource: Record<string, number> = {};
  const byVisaType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  for (const lead of allLeads) {
    bySource[lead.source] = (bySource[lead.source] ?? 0) + 1;
    byVisaType[lead.visa_type] = (byVisaType[lead.visa_type] ?? 0) + 1;
    byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;
  }

  const dueFollowUps = allLeads.filter((l) => {
    if (!l.next_follow_up_at || l.status === "won" || l.status === "lost") return false;
    const d = new Date(l.next_follow_up_at);
    return isBefore(d, todayEnd);
  });

  return {
    totalLeads: allLeads.length,
    leadsThisWeek: allLeads.filter((l) => isAfter(new Date(l.created_at), weekStart)).length,
    leadsThisMonth: allLeads.filter((l) => isAfter(new Date(l.created_at), monthStart)).length,
    followUpsDueToday: allLeads.filter((l) => {
      if (!l.next_follow_up_at || l.status === "won" || l.status === "lost") return false;
      const d = new Date(l.next_follow_up_at);
      return d >= todayStart && d <= todayEnd;
    }).length,
    followUpsOverdue: allLeads.filter((l) => {
      if (!l.next_follow_up_at || l.status === "won" || l.status === "lost") return false;
      return isBefore(new Date(l.next_follow_up_at), todayStart);
    }).length,
    wonCount: allLeads.filter((l) => l.status === "won").length,
    lostCount: allLeads.filter((l) => l.status === "lost").length,
    bySource,
    byVisaType,
    byStatus,
    recentLeads: allLeads.slice(0, 5),
    dueFollowUps: dueFollowUps.sort(
      (a, b) =>
        new Date(a.next_follow_up_at!).getTime() -
        new Date(b.next_follow_up_at!).getTime()
    ),
  };
}
