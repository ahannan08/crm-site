import {
  startOfWeek,
  startOfMonth,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
} from "date-fns";
import { createAdminClient } from "./admin";
import { sendAgentWelcomeEmail } from "../email";
import {
  bucketSourceForDashboard,
  DASHBOARD_SOURCES,
  DISPOSITIONS,
  isLeadClosed,
  labelForServiceType,
  statusFromDisposition,
} from "../constants";
import type {
  Activity,
  ActivityType,
  AgentStatus,
  DashboardDateRange,
  DashboardStats,
  Lead,
  LeadDisposition,
  LeadSource,
  LeadStatus,
  MaritalStatus,
  User,
  UserRole,
  VisaType,
} from "../types";
import type {
  CreateAgentInput,
  CreateLeadInput,
  LeadFilters,
  UpdateLeadInput,
  AgentSummary,
} from "../db";

function mapProfileToUser(row: {
  id: string;
  name: string;
  email: string;
  phone: string;
  app_role: string;
  agent_status: string | null;
  joined_at: string;
}): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? "",
    password: "",
    role: (row.app_role === "admin" ? "admin" : "agent") as UserRole,
    agent_status: (row.agent_status ?? undefined) as AgentStatus | undefined,
    joined_at: row.joined_at,
  };
}

function mapLeadRow(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    enquiry_date: row.enquiry_date as string,
    name: row.name as string,
    phone: row.phone as string,
    email: (row.email as string) ?? "",
    age: (row.age as number | null) ?? null,
    city: (row.city as string) ?? "",
    visa_type: row.visa_type as VisaType,
    service_type: (row.service_type as string) ?? "",
    disposition: ((row.disposition as string) ?? "no_answer") as Lead["disposition"],
    cva_score: (row.cva_score as string) ?? "",
    lr_score: (row.lr_score as number | null) ?? null,
    source: row.source as LeadSource,
    marital_status: ((row.marital_status as string | null) ?? "") as MaritalStatus | "",
    kids: (row.kids as number | null) ?? null,
    highest_qualification: (row.highest_qualification as string) ?? "",
    year_finished: (row.year_finished as string) ?? "",
    passport_expiry: (row.passport_expiry as string) ?? "",
    travel_history: (row.travel_history as string) ?? "",
    refusals: (row.refusals as string) ?? "",
    country_of_choice: (row.country_of_choice as string) ?? "",
    occupation: (row.occupation as string) ?? "",
    monthly_income: (row.monthly_income as string) ?? "",
    savings: (row.savings as string) ?? "",
    itr: (row.itr as string) ?? "",
    property_details: (row.property_details as string) ?? "",
    status: row.status as LeadStatus,
    assigned_to: (row.assigned_to as string | null) ?? null,
    next_follow_up_at: (row.next_follow_up_at as string | null) ?? null,
    whatsapp_reminders_enabled: (row.whatsapp_reminders_enabled as boolean | undefined) ?? true,
    notes: (row.notes as string) ?? "",
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function leadToInsert(orgId: string, input: CreateLeadInput) {
  const now = new Date().toISOString();
  return {
    organization_id: orgId,
    enquiry_date: input.enquiry_date,
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
    marital_status: input.marital_status || null,
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
    created_at: new Date(input.enquiry_date).toISOString(),
    updated_at: now,
  };
}

function applyLeadFilters(leads: Lead[], filters: LeadFilters): Lead[] {
  let result = [...leads];

  if (filters.mine) {
    result = result.filter((l) => l.assigned_to === filters.mine);
  }
  if (filters.visa_type) {
    result = result.filter((l) => l.visa_type === filters.visa_type);
  }
  if (filters.source) {
    result = result.filter((l) => l.source === filters.source);
  }
  if (filters.status) {
    result = result.filter((l) => l.status === filters.status);
  }
  if (filters.disposition) {
    result = result.filter((l) => l.disposition === filters.disposition);
  }
  if (filters.assigned_to) {
    result = result.filter((l) => l.assigned_to === filters.assigned_to);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q)
    );
  }
  if (filters.period === "week") {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    result = result.filter((l) => isAfter(new Date(l.created_at), weekStart));
  }
  if (filters.period === "month") {
    const monthStart = startOfMonth(new Date());
    result = result.filter((l) => isAfter(new Date(l.created_at), monthStart));
  }

  return result.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getUsers(orgId: string): Promise<User[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, name, email, phone, app_role, agent_status, joined_at")
    .eq("organization_id", orgId)
    .in("app_role", ["admin", "agent"]);

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProfileToUser);
}

export async function getUserById(orgId: string, id: string): Promise<User | undefined> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, name, email, phone, app_role, agent_status, joined_at")
    .eq("organization_id", orgId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapProfileToUser(data) : undefined;
}

export async function getAgents(orgId: string): Promise<AgentSummary[]> {
  const admin = createAdminClient();
  const [{ data: agents, error: agentError }, { data: leads, error: leadError }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, name, email, phone, app_role, agent_status, joined_at")
        .eq("organization_id", orgId)
        .eq("app_role", "agent"),
      admin.from("leads").select("assigned_to").eq("organization_id", orgId),
    ]);

  if (agentError) throw new Error(agentError.message);
  if (leadError) throw new Error(leadError.message);

  const leadCounts = new Map<string, number>();
  for (const lead of leads ?? []) {
    if (lead.assigned_to) {
      leadCounts.set(lead.assigned_to, (leadCounts.get(lead.assigned_to) ?? 0) + 1);
    }
  }

  return (agents ?? []).map((agent) => {
    const { password: _, ...user } = mapProfileToUser(agent);
    return { ...user, leadCount: leadCounts.get(agent.id) ?? 0 };
  });
}

export async function getAgentLeads(orgId: string, agentId: string): Promise<Lead[]> {
  return getLeads(orgId, { assigned_to: agentId });
}

export async function getLeads(orgId: string, filters: LeadFilters = {}): Promise<Lead[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("leads")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return applyLeadFilters((data ?? []).map(mapLeadRow), filters);
}

export async function getLeadById(orgId: string, id: string): Promise<Lead | undefined> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("leads")
    .select("*")
    .eq("organization_id", orgId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapLeadRow(data) : undefined;
}

export async function createLead(orgId: string, input: CreateLeadInput): Promise<Lead> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("leads")
    .insert(leadToInsert(orgId, input))
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create lead");
  return mapLeadRow(data);
}

export async function updateLead(
  orgId: string,
  id: string,
  input: UpdateLeadInput
): Promise<Lead | null> {
  const admin = createAdminClient();
  const payload: Record<string, unknown> = {
    ...input,
    updated_at: new Date().toISOString(),
  };
  if (input.marital_status === "") payload.marital_status = null;
  if (input.disposition) {
    payload.status = input.status ?? statusFromDisposition(input.disposition);
  }

  const { data, error } = await admin
    .from("leads")
    .update(payload)
    .eq("organization_id", orgId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapLeadRow(data) : null;
}

export async function getActivities(orgId: string, leadId: string): Promise<Activity[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("activities")
    .select("*")
    .eq("organization_id", orgId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Activity[];
}

export async function createActivity(
  orgId: string,
  leadId: string,
  userId: string,
  type: ActivityType,
  description: string
): Promise<Activity> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("activities")
    .insert({
      organization_id: orgId,
      lead_id: leadId,
      user_id: userId,
      type,
      description,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create activity");
  return data as Activity;
}

export async function getActiveAgentsCount(orgId: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("app_role", "agent")
    .eq("agent_status", "active");

  if (error) throw new Error(error.message);
  return count ?? 0;
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

export async function getDashboardStats(
  orgId: string,
  userId: string,
  role: string,
  dateRange?: Partial<DashboardDateRange>
): Promise<DashboardStats> {
  const range: DashboardDateRange = {
    ...defaultDashboardDateRange(),
    ...dateRange,
  };

  const allLeadsRaw = await getLeads(orgId, role === "agent" ? { mine: userId } : {});
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
    return isBefore(new Date(l.next_follow_up_at), todayEnd);
  });

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
        new Date(a.next_follow_up_at!).getTime() - new Date(b.next_follow_up_at!).getTime()
    ),
    activeAgents: await getActiveAgentsCount(orgId),
    dateRange: range,
  };
}

export interface CreateAgentResult {
  user: User;
  emailSent: boolean;
}

export async function createAgent(orgId: string, input: CreateAgentInput): Promise<CreateAgentResult> {
  const admin = createAdminClient();
  const email = input.email.trim().toLowerCase();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) throw new Error("Email already in use");

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name },
  });

  if (authError || !authUser.user) {
    throw new Error(authError?.message ?? "Failed to create agent account");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authUser.user.id,
    organization_id: orgId,
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() ?? "",
    app_role: "agent",
    agent_status: input.agent_status ?? "active",
    onboarding_complete: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    throw new Error(profileError.message);
  }

  const { data: org } = await admin
    .from("organizations")
    .select("name, website")
    .eq("id", orgId)
    .single();

  const user = mapProfileToUser({
    id: authUser.user.id,
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() ?? "",
    app_role: "agent",
    agent_status: input.agent_status ?? "active",
    joined_at: new Date().toISOString(),
  });

  const emailSent = await sendAgentWelcomeEmail({
    to: email,
    name: input.name.trim(),
    agencyName: org?.name ?? "Your agency",
    agencyWebsite: org?.website || undefined,
    email,
    password: input.password,
  });

  return { user, emailSent };
}
