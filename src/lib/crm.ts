import * as mockDb from "./db";
import * as supabaseCrm from "./supabase/crm-store";
import { isMockSession } from "./mock-auth";
import type { SessionUser, User } from "./types";

export type {
  CreateAgentInput,
  CreateLeadInput,
  UpdateLeadInput,
  LeadFilters,
  AgentSummary,
} from "./db";

function requireOrgId(session: SessionUser): string {
  if (!session.organizationId) {
    throw new Error("Organization not found for this account");
  }
  return session.organizationId;
}

function leadFiltersForSession(session: SessionUser, filters: mockDb.LeadFilters = {}) {
  return {
    ...filters,
    mine: session.role === "agent" ? session.id : filters.mine,
  };
}

export async function getUsers(session: SessionUser) {
  if (isMockSession(session)) return mockDb.getUsers();
  return supabaseCrm.getUsers(requireOrgId(session));
}

export async function getUserById(session: SessionUser, id: string) {
  if (isMockSession(session)) return mockDb.getUserById(id);
  return supabaseCrm.getUserById(requireOrgId(session), id);
}

export async function getAgents(session: SessionUser) {
  if (isMockSession(session)) return mockDb.getAgents();
  return supabaseCrm.getAgents(requireOrgId(session));
}

export async function getAgentLeads(session: SessionUser, agentId: string) {
  if (isMockSession(session)) return mockDb.getAgentLeads(agentId);
  return supabaseCrm.getAgentLeads(requireOrgId(session), agentId);
}

export async function getLeads(session: SessionUser, filters: mockDb.LeadFilters = {}) {
  if (isMockSession(session)) {
    return mockDb.getLeads(leadFiltersForSession(session, filters));
  }
  return supabaseCrm.getLeads(requireOrgId(session), leadFiltersForSession(session, filters));
}

export async function getLeadById(session: SessionUser, id: string) {
  if (isMockSession(session)) return mockDb.getLeadById(id);
  return supabaseCrm.getLeadById(requireOrgId(session), id);
}

export async function createLead(session: SessionUser, input: mockDb.CreateLeadInput) {
  if (isMockSession(session)) return mockDb.createLead(input);
  return supabaseCrm.createLead(requireOrgId(session), input);
}

export async function updateLead(
  session: SessionUser,
  id: string,
  input: mockDb.UpdateLeadInput
) {
  if (isMockSession(session)) return mockDb.updateLead(id, input);
  return supabaseCrm.updateLead(requireOrgId(session), id, input);
}

export async function getActivities(session: SessionUser, leadId: string) {
  if (isMockSession(session)) return mockDb.getActivities(leadId);
  return supabaseCrm.getActivities(requireOrgId(session), leadId);
}

export async function createActivity(
  session: SessionUser,
  leadId: string,
  userId: string,
  type: Parameters<typeof mockDb.createActivity>[2],
  description: string
) {
  if (isMockSession(session)) {
    return mockDb.createActivity(leadId, userId, type, description);
  }
  return supabaseCrm.createActivity(requireOrgId(session), leadId, userId, type, description);
}

export async function getDashboardStats(session: SessionUser) {
  if (isMockSession(session)) {
    return mockDb.getDashboardStats(session.id, session.role);
  }
  return supabaseCrm.getDashboardStats(requireOrgId(session), session.id, session.role);
}

export interface CreateAgentResult {
  user: User;
  emailSent: boolean;
}

export async function createAgent(
  session: SessionUser,
  input: mockDb.CreateAgentInput
): Promise<CreateAgentResult> {
  if (isMockSession(session)) {
    return { user: mockDb.createAgent(input), emailSent: false };
  }
  return supabaseCrm.createAgent(requireOrgId(session), input);
}

export function stripPassword<T extends { password?: string }>(user: T) {
  const { password: _, ...safe } = user;
  return safe;
}
