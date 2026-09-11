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
  LeadDisposition,
  MaritalStatus,
  User,
  VisaType,
  AgentStatus,
  AgentStatusFilter,
  NotificationLog,
  DashboardDateRange,
} from "./types";
import {
  bucketSourceForDashboard,
  DASHBOARD_SOURCES,
  DISPOSITIONS,
  isLeadClosed,
  labelForServiceType,
  statusFromDisposition,
} from "./constants";
import { computeLeadsByMonth, computeOpenLeadsMetrics } from "./open-leads-stats";
import {
  summarizeLeadCounts,
  matchesTransferLeadType,
  type TransferLeadType,
  type LeadCountSummary,
} from "./lead-utils";

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
    agent_status: raw.role === "agent" ? (raw.agent_status ?? "active") : undefined,
    designation: raw.designation ?? "",
    last_login_at: raw.last_login_at ?? null,
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
    service_type: raw.service_type ?? "",
    disposition: (raw.disposition ?? "no_answer") as LeadDisposition,
    cva_score: raw.cva_score ?? "",
    lr_score: raw.lr_score ?? null,
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
    whatsapp_reminders_enabled: raw.whatsapp_reminders_enabled ?? true,
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
  if (!db.notification_logs) db.notification_logs = [];
  return db;
}

function saveDb(db: Database): void {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getUsers(): User[] {
  return ensureDb().users;
}

export function getUserByEmail(email: string): User | undefined {
  const normalized = email.trim().toLowerCase();
  return ensureDb().users.find((u) => u.email.toLowerCase() === normalized);
}

export function getUserById(id: string): User | undefined {
  return ensureDb().users.find((u) => u.id === id);
}

export interface AgentSummary extends Omit<User, "password"> {
  leadCount: number;
}

export function getAgents(statusFilter: AgentStatusFilter = "all"): AgentSummary[] {
  const db = ensureDb();
  return db.users
    .filter((u) => {
      if (u.role !== "agent") return false;
      if (statusFilter === "all") return true;
      return (u.agent_status ?? "active") === statusFilter;
    })
    .map(({ password: _, ...user }) => ({
      ...user,
      leadCount: db.leads.filter((l) => l.assigned_to === user.id).length,
    }));
}

export function getAgentLeads(agentId: string): Lead[] {
  return getLeads({ assigned_to: agentId });
}

export function getActiveAgentsCount(): number {
  return ensureDb().users.filter((u) => u.role === "agent" && u.agent_status === "active").length;
}

export interface CreateAgentInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  agent_status?: AgentStatus;
  designation?: string;
}

export function updateLastLogin(userId: string): void {
  const db = ensureDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return;
  user.last_login_at = new Date().toISOString();
  saveDb(db);
}

export function createAgent(input: CreateAgentInput): User {
  const db = ensureDb();
  if (db.users.some((u) => u.email === input.email)) {
    throw new Error("Email already in use");
  }
  const agent = normalizeUser({
    id: randomUUID(),
    name: input.name,
    email: input.email,
    phone: input.phone ?? "",
    password: input.password,
    role: "agent",
    agent_status: input.agent_status ?? "active",
    designation: input.designation?.trim() ?? "",
    joined_at: new Date().toISOString(),
  });
  db.users.push(agent);
  saveDb(db);
  return agent;
}

export interface LeadFilters {
  visa_type?: VisaType;
  disposition?: LeadDisposition;
  source?: LeadSource;
  status?: LeadStatus;
  assigned_to?: string;
  service_type?: string;
  search?: string;
  mine?: string;
  period?: "week" | "month";
  organization_id?: string;
  follow_up?: "due" | "scheduled";
}

export function getLeads(filters: LeadFilters = {}): Lead[] {
  const db = ensureDb();
  let leads = [...db.leads];

  if (filters.organization_id) {
    leads = leads.filter((l) => l.organization_id === filters.organization_id);
  }
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
  if (filters.disposition) {
    leads = leads.filter((l) => l.disposition === filters.disposition);
  }
  if (filters.assigned_to) {
    leads = leads.filter((l) => l.assigned_to === filters.assigned_to);
  }
  if (filters.service_type) {
    leads = leads.filter((l) => l.service_type === filters.service_type);
  }
  if (filters.follow_up === "due") {
    const now = new Date();
    leads = leads.filter(
      (l) => l.next_follow_up_at && !isLeadClosed(l) && new Date(l.next_follow_up_at) <= now
    );
  }
  if (filters.follow_up === "scheduled") {
    leads = leads.filter((l) => l.next_follow_up_at && !isLeadClosed(l));
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
  if (filters.period === "week") {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    leads = leads.filter((l) => isAfter(new Date(l.created_at), weekStart));
  }
  if (filters.period === "month") {
    const monthStart = startOfMonth(new Date());
    leads = leads.filter((l) => isAfter(new Date(l.created_at), monthStart));
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
  service_type?: string;
  disposition?: LeadDisposition;
  cva_score?: string;
  lr_score?: number | null;
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
  whatsapp_reminders_enabled?: boolean;
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
    service_type: input.service_type ?? "",
    disposition: input.disposition ?? "no_answer",
    cva_score: input.cva_score ?? "",
    lr_score: input.lr_score ?? null,
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
    status: input.status ?? statusFromDisposition(input.disposition ?? "no_answer"),
    assigned_to: input.assigned_to ?? null,
    next_follow_up_at: input.next_follow_up_at ?? null,
    whatsapp_reminders_enabled: input.whatsapp_reminders_enabled ?? true,
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
  service_type?: string;
  disposition?: LeadDisposition;
  cva_score?: string;
  lr_score?: number | null;
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
  whatsapp_reminders_enabled?: boolean;
  notes?: string;
}

export function updateLead(id: string, input: UpdateLeadInput): Lead | null {
  const db = ensureDb();
  const index = db.leads.findIndex((l) => l.id === id);
  if (index === -1) return null;

  const nextDisposition = input.disposition ?? db.leads[index].disposition;
  db.leads[index] = {
    ...db.leads[index],
    ...input,
    status: input.status ?? (input.disposition ? statusFromDisposition(nextDisposition) : db.leads[index].status),
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

export function getLeadCountsForUser(userId: string): LeadCountSummary {
  return summarizeLeadCounts(getLeads({ assigned_to: userId }));
}

export interface TransferLeadsInput {
  from_user_id: string;
  to_user_id: string;
  service_type?: string;
  lead_type: TransferLeadType;
  reason: string;
  actor_user_id: string;
}

export function transferLeads(input: TransferLeadsInput): number {
  const db = ensureDb();
  let leads = db.leads.filter((l) => l.assigned_to === input.from_user_id);
  if (input.service_type) {
    leads = leads.filter((l) => l.service_type === input.service_type);
  }
  leads = leads.filter((l) => matchesTransferLeadType(l, input.lead_type));

  const now = new Date().toISOString();
  let count = 0;
  for (const lead of leads) {
    const index = db.leads.findIndex((l) => l.id === lead.id);
    if (index === -1) continue;
    db.leads[index] = {
      ...db.leads[index],
      assigned_to: input.to_user_id,
      updated_at: now,
    };
    db.activities.push({
      id: randomUUID(),
      lead_id: lead.id,
      user_id: input.actor_user_id,
      type: "note",
      description: `Lead transferred: ${input.reason}`,
      created_at: now,
    });
    count++;
  }
  if (count > 0) saveDb(db);
  return count;
}

export interface BulkUpdateLeadsInput {
  lead_ids: string[];
  disposition?: LeadDisposition;
  status?: LeadStatus;
  assigned_to?: string | null;
  source?: LeadSource;
  actor_user_id: string;
}

export function bulkUpdateLeads(input: BulkUpdateLeadsInput): number {
  let count = 0;
  for (const id of input.lead_ids) {
    const patch: UpdateLeadInput = {};
    if (input.disposition !== undefined) patch.disposition = input.disposition;
    if (input.status !== undefined) patch.status = input.status;
    if (input.assigned_to !== undefined) patch.assigned_to = input.assigned_to;
    if (input.source !== undefined) patch.source = input.source;
    if (Object.keys(patch).length === 0) continue;
    const updated = updateLead(id, patch);
    if (updated) {
      createActivity(id, input.actor_user_id, "note", "Bulk lead update applied");
      count++;
    }
  }
  return count;
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

function defaultDashboardDateRange(): DashboardDateRange {
  const now = new Date();
  const from = startOfMonth(now).toISOString().split("T")[0];
  const to = now.toISOString().split("T")[0];
  return { from, to };
}

function leadInDateRange(lead: Lead, range: DashboardDateRange): boolean {
  const day = lead.enquiry_date?.slice(0, 10) ?? lead.created_at.slice(0, 10);
  return day >= range.from && day <= range.to;
}

export function getDashboardStats(
  userId?: string,
  role?: string,
  dateRange?: Partial<DashboardDateRange>
): DashboardStats {
  const range: DashboardDateRange = {
    ...defaultDashboardDateRange(),
    ...dateRange,
  };

  const allLeadsRaw = getLeads(role === "agent" && userId ? { mine: userId } : {});
  const allLeads = allLeadsRaw.filter((l) => leadInDateRange(l, range));
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const bySource: Record<string, number> = Object.fromEntries(
    DASHBOARD_SOURCES.map((s) => [s.value, 0])
  );
  const byVisaType: Record<string, number> = {};
  const byServiceType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byDisposition: Record<string, number> = Object.fromEntries(
    DISPOSITIONS.map((d) => [d.value, 0])
  );

  for (const lead of allLeads) {
    const bucket = bucketSourceForDashboard(lead.source);
    bySource[bucket] = (bySource[bucket] ?? 0) + 1;
    byVisaType[lead.visa_type] = (byVisaType[lead.visa_type] ?? 0) + 1;
    const serviceLabel = labelForServiceType(lead);
    byServiceType[serviceLabel] = (byServiceType[serviceLabel] ?? 0) + 1;
    byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;
    byDisposition[lead.disposition] = (byDisposition[lead.disposition] ?? 0) + 1;
  }

  const dueFollowUps = allLeads.filter((l) => {
    if (!l.next_follow_up_at || isLeadClosed(l)) return false;
    const d = new Date(l.next_follow_up_at);
    return isBefore(d, todayEnd);
  });

  const { openLeadsCount, openLeadsByMonth } = computeOpenLeadsMetrics(allLeads);
  const leadsByMonth = computeLeadsByMonth(allLeads);

  return {
    totalLeads: allLeads.length,
    newEnquiries: allLeads.filter((l) => l.status === "new").length,
    leadsThisWeek: allLeads.filter((l) => isAfter(new Date(l.created_at), weekStart)).length,
    leadsThisMonth: allLeads.filter((l) => isAfter(new Date(l.created_at), monthStart)).length,
    followUpsDueToday: allLeads.filter((l) => {
      if (!l.next_follow_up_at || isLeadClosed(l)) return false;
      const d = new Date(l.next_follow_up_at);
      return d >= todayStart && d <= todayEnd;
    }).length,
    followUpsOverdue: allLeads.filter((l) => {
      if (!l.next_follow_up_at || isLeadClosed(l)) return false;
      return isBefore(new Date(l.next_follow_up_at), todayStart);
    }).length,
    wonCount: allLeads.filter(
      (l) => l.status === "won" || l.disposition === "converted"
    ).length,
    lostCount: allLeads.filter(
      (l) => l.status === "lost" || l.disposition === "lost"
    ).length,
    bySource,
    byVisaType,
    byServiceType,
    byStatus,
    byDisposition,
    recentLeads: allLeads.slice(0, 5),
    dueFollowUps: dueFollowUps.sort(
      (a, b) =>
        new Date(a.next_follow_up_at!).getTime() -
        new Date(b.next_follow_up_at!).getTime()
    ),
    activeAgents: getActiveAgentsCount(),
    openLeadsCount,
    openLeadsByMonth,
    leadsByMonth,
    dateRange: range,
  };
}

export function getMockLeadsForWhatsAppReminders(): Lead[] {
  return ensureDb().leads.filter(
    (l) => l.whatsapp_reminders_enabled && l.next_follow_up_at && !isLeadClosed(l)
  );
}

export function hasMockNotificationLog(leadId: string, milestone: string): boolean {
  const db = ensureDb();
  return db.notification_logs.some(
    (n) => n.lead_id === leadId && n.milestone === milestone
  );
}

export function addMockNotificationLog(
  leadId: string,
  milestone: string,
  recipients: string[]
): void {
  const db = ensureDb();
  db.notification_logs.push({
    id: randomUUID(),
    lead_id: leadId,
    milestone: milestone as NotificationLog["milestone"],
    sent_at: new Date().toISOString(),
    recipients,
  });
  saveDb(db);
}
