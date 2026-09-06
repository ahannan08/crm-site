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
  MaritalStatus,
  User,
  VisaType,
} from "./types";
import { bucketSourceForDashboard, DASHBOARD_SOURCES } from "./constants";

const DATA_DIR = join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "db.json");
const SEED_PATH = join(DATA_DIR, "seed.json");

function normalizeSource(source: string): LeadSource {
  if (source === "facebook" || source === "instagram") return "meta";
  if (source === "phone_call") return "other";
  const valid: LeadSource[] = ["meta", "justdial", "walk_in", "google_ads", "website", "referral", "other"];
  if (valid.includes(source as LeadSource)) return source as LeadSource;
  return "other";
}

function normalizeUser(raw: Partial<User> & Pick<User, "id" | "name" | "email" | "password" | "role">): User {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone ?? "",
    password: raw.password,
    role: raw.role,
    joined_at: raw.joined_at ?? new Date().toISOString(),
  };
}

function normalizeLead(raw: Partial<Lead> & Pick<Lead, "id" | "name" | "phone">): Lead {
  const createdAt = raw.created_at ?? new Date().toISOString();
  return {
    id: raw.id,
    enquiry_date: raw.enquiry_date ?? createdAt.split("T")[0],
    name: raw.name,
    phone: raw.phone,
    email: raw.email ?? "",
    age: raw.age ?? null,
    city: raw.city ?? "",
    visa_type: raw.visa_type ?? "visit",
    source: normalizeSource(raw.source ?? "walk_in"),
    marital_status: (raw.marital_status ?? "") as MaritalStatus | "",
    kids: raw.kids ?? null,
    highest_qualification: raw.highest_qualification ?? "",
    year_finished: raw.year_finished ?? "",
    passport_expiry: raw.passport_expiry ?? "",
    travel_history: raw.travel_history ?? "",
    refusals: raw.refusals ?? "",
    country_of_choice: raw.country_of_choice ?? "",
    occupation: raw.occupation ?? "",
    monthly_income: raw.monthly_income ?? "",
    savings: raw.savings ?? "",
    itr: raw.itr ?? "",
    property_details: raw.property_details ?? "",
    status: raw.status ?? "new",
    assigned_to: raw.assigned_to ?? null,
    next_follow_up_at: raw.next_follow_up_at ?? null,
    notes: raw.notes ?? "",
    created_at: createdAt,
    updated_at: raw.updated_at ?? createdAt,
  };
}

function ensureDb(): Database {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(DB_PATH)) {
    copyFileSync(SEED_PATH, DB_PATH);
  }
  const db = JSON.parse(readFileSync(DB_PATH, "utf-8")) as Database;
  db.users = db.users.map((user) => normalizeUser(user));
  db.leads = db.leads.map((lead) => normalizeLead(lead));
  return db;
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

export interface AgentSummary extends Omit<User, "password"> {
  leadCount: number;
}

export function getAgents(): AgentSummary[] {
  const db = ensureDb();
  return db.users
    .filter((u) => u.role === "agent")
    .map(({ password: _, ...user }) => ({
      ...user,
      leadCount: db.leads.filter((l) => l.assigned_to === user.id).length,
    }));
}

export function getAgentLeads(agentId: string): Lead[] {
  return getLeads({ assigned_to: agentId });
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
  enquiry_date: string;
  name: string;
  phone: string;
  email?: string;
  age?: number | null;
  city?: string;
  visa_type?: VisaType;
  source?: LeadSource;
  marital_status?: MaritalStatus | "";
  kids?: number | null;
  highest_qualification?: string;
  year_finished?: string;
  passport_expiry?: string;
  travel_history?: string;
  refusals?: string;
  country_of_choice?: string;
  occupation?: string;
  monthly_income?: string;
  savings?: string;
  itr?: string;
  property_details?: string;
  status?: LeadStatus;
  assigned_to?: string | null;
  next_follow_up_at?: string | null;
  notes?: string;
}

export function createLead(input: CreateLeadInput): Lead {
  const db = ensureDb();
  const now = new Date().toISOString();
  const enquiryDate = input.enquiry_date;
  const createdAt = new Date(enquiryDate).toISOString();

  const lead = normalizeLead({
    id: randomUUID(),
    enquiry_date: enquiryDate,
    name: input.name,
    phone: input.phone,
    email: input.email ?? "",
    age: input.age ?? null,
    city: input.city ?? "",
    visa_type: input.visa_type ?? "visit",
    source: input.source ?? "walk_in",
    marital_status: input.marital_status ?? "",
    kids: input.kids ?? null,
    highest_qualification: input.highest_qualification ?? "",
    year_finished: input.year_finished ?? "",
    passport_expiry: input.passport_expiry ?? "",
    travel_history: input.travel_history ?? "",
    refusals: input.refusals ?? "",
    country_of_choice: input.country_of_choice ?? "",
    occupation: input.occupation ?? "",
    monthly_income: input.monthly_income ?? "",
    savings: input.savings ?? "",
    itr: input.itr ?? "",
    property_details: input.property_details ?? "",
    status: input.status ?? "new",
    assigned_to: input.assigned_to ?? null,
    next_follow_up_at: input.next_follow_up_at ?? null,
    notes: input.notes ?? "",
    created_at: createdAt,
    updated_at: now,
  });

  db.leads.push(lead);
  saveDb(db);
  return lead;
}

export interface UpdateLeadInput {
  enquiry_date?: string;
  name?: string;
  phone?: string;
  email?: string;
  age?: number | null;
  city?: string;
  visa_type?: VisaType;
  source?: LeadSource;
  marital_status?: MaritalStatus | "";
  kids?: number | null;
  highest_qualification?: string;
  year_finished?: string;
  passport_expiry?: string;
  travel_history?: string;
  refusals?: string;
  country_of_choice?: string;
  occupation?: string;
  monthly_income?: string;
  savings?: string;
  itr?: string;
  property_details?: string;
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

  const bySource: Record<string, number> = Object.fromEntries(
    DASHBOARD_SOURCES.map((s) => [s.value, 0])
  );
  const byVisaType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  for (const lead of allLeads) {
    const bucket = bucketSourceForDashboard(lead.source);
    bySource[bucket] = (bySource[bucket] ?? 0) + 1;
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
    newEnquiries: allLeads.filter((l) => l.status === "new").length,
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
