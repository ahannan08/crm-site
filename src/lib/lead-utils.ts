import { isLeadClosed } from "./constants";
import type { Lead, LeadStatus } from "./types";

export type LeadPipelineCategory = "open" | "registered" | "closed";

const REGISTERED_STATUSES: LeadStatus[] = ["documents_pending", "applied"];

export function leadPipelineCategory(lead: Lead): LeadPipelineCategory {
  if (isLeadClosed(lead)) return "closed";
  if (REGISTERED_STATUSES.includes(lead.status)) return "registered";
  return "open";
}

export function leadCode(lead: Lead): string {
  return `V-${lead.id.replace(/-/g, "").slice(-6).toUpperCase()}`;
}

export interface LeadCountSummary {
  open: number;
  registered: number;
  closed: number;
}

export function summarizeLeadCounts(leads: Lead[]): LeadCountSummary {
  const summary: LeadCountSummary = { open: 0, registered: 0, closed: 0 };
  for (const lead of leads) {
    summary[leadPipelineCategory(lead)] += 1;
  }
  return summary;
}

export type TransferLeadType = "open" | "registered" | "open_registered" | "all";

export function matchesTransferLeadType(lead: Lead, leadType: TransferLeadType): boolean {
  const category = leadPipelineCategory(lead);
  if (leadType === "all") return true;
  if (leadType === "open_registered") return category === "open" || category === "registered";
  return category === leadType;
}
