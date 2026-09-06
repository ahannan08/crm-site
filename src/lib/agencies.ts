import type { AppRole, AgentStatus } from "./types";

export interface AgencyMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  app_role: AppRole;
  agent_status: AgentStatus | null;
  joined_at: string;
}

export interface AgencySummary {
  id: string;
  name: string;
  website: string;
  description: string;
  created_at: string;
  admin_name: string;
  admin_email: string;
  agent_count: number;
}

export interface AgencyDetail extends AgencySummary {
  admin: AgencyMember | null;
  agents: AgencyMember[];
}
