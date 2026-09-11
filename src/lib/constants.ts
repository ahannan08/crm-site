import type {
  LeadDisposition,
  LeadSource,
  LeadStatus,
  MaritalStatus,
  AgentStatus,
  AgentStatusFilter,
  VisaType,
} from "./types";

export const VISA_TYPES: { value: VisaType; label: string }[] = [
  { value: "visit", label: "Visit Visa" },
  { value: "student", label: "Student Visa" },
  { value: "business", label: "Business Visa" },
];

/** Suggestions for free-text service type field */
export const SERVICE_TYPE_SUGGESTIONS = [
  "Visit Visa",
  "Student Visa",
  "Business Visa",
  "Work Permit",
  "PR / Immigration",
  "Dependent Visa",
  "Tourist Visa",
];

export const DISPOSITIONS: { value: LeadDisposition; label: string; color: string }[] = [
  { value: "no_answer", label: "No Answer", color: "bg-slate-100 text-slate-700" },
  { value: "follow_up", label: "Follow up", color: "bg-amber-100 text-amber-800" },
  { value: "visited", label: "Visited", color: "bg-cyan-100 text-cyan-800" },
  { value: "lost", label: "Lost", color: "bg-red-100 text-red-800" },
  { value: "converted", label: "Converted", color: "bg-green-100 text-green-800" },
  { value: "documentation", label: "Documentation", color: "bg-orange-100 text-orange-800" },
  { value: "visa_in_process", label: "Visa in process", color: "bg-purple-100 text-purple-800" },
  { value: "meeting_booked", label: "Meeting Booked", color: "bg-indigo-100 text-indigo-800" },
];

export const DISPOSITIONS_REQUIRING_SCHEDULE: LeadDisposition[] = [
  "follow_up",
  "meeting_booked",
];

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: "meta", label: "Meta" },
  { value: "justdial", label: "JustDial" },
  { value: "walk_in", label: "Walk-in" },
  { value: "google_ads", label: "Google Ads" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
];

export const DASHBOARD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: "justdial", label: "Just Dial" },
  { value: "meta", label: "Meta" },
  { value: "google_ads", label: "Google Ads" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
  { value: "referral", label: "Referral" },
];

export const MARITAL_STATUSES: { value: MaritalStatus; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
  { value: "other", label: "Other" },
];

export const AGENT_STATUSES: { value: AgentStatus; label: string; color: string }[] = [
  { value: "active", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "inactive", label: "Inactive", color: "bg-slate-100 text-slate-600" },
  { value: "deleted", label: "Deleted", color: "bg-red-100 text-red-700" },
];

/** Status options when creating or editing an agent (excludes deleted). */
export const AGENT_CREATABLE_STATUSES = AGENT_STATUSES.filter((s) => s.value !== "deleted");

export const AGENT_STATUS_FILTERS: { value: AgentStatusFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "deleted", label: "Deleted" },
  { value: "all", label: "All" },
];

export function agentStatusColor(status: string): string {
  return AGENT_STATUSES.find((s) => s.value === status)?.color ?? "bg-gray-100 text-gray-800";
}

export function labelForAgentStatus(status: string): string {
  return AGENT_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "contacted", label: "Contacted", color: "bg-cyan-100 text-cyan-800" },
  { value: "interested", label: "Interested", color: "bg-amber-100 text-amber-800" },
  { value: "documents_pending", label: "Documents Pending", color: "bg-orange-100 text-orange-800" },
  { value: "applied", label: "Applied", color: "bg-purple-100 text-purple-800" },
  { value: "won", label: "Won", color: "bg-green-100 text-green-800" },
  { value: "lost", label: "Lost", color: "bg-red-100 text-red-800" },
];

export function labelForSource(source: string): string {
  return (
    LEAD_SOURCES.find((s) => s.value === source)?.label ??
    DASHBOARD_SOURCES.find((s) => s.value === source)?.label ??
    source
  );
}

export function bucketSourceForDashboard(source: string): LeadSource {
  if (source === "facebook" || source === "instagram") return "meta";
  if (source === "walk_in" || source === "phone_call") return "other";
  if (DASHBOARD_SOURCES.some((s) => s.value === source)) return source as LeadSource;
  return "other";
}

export function labelForVisaType(type: string): string {
  return VISA_TYPES.find((v) => v.value === type)?.label ?? type;
}

export function labelForServiceType(lead: { service_type?: string; visa_type?: string }): string {
  if (lead.service_type?.trim()) return lead.service_type.trim();
  return labelForVisaType(lead.visa_type ?? "visit");
}

export function labelForDisposition(disposition: string): string {
  return DISPOSITIONS.find((d) => d.value === disposition)?.label ?? disposition;
}

export function dispositionColor(disposition: string): string {
  return DISPOSITIONS.find((d) => d.value === disposition)?.color ?? "bg-gray-100 text-gray-800";
}

export function statusFromDisposition(disposition: LeadDisposition): LeadStatus {
  if (disposition === "lost") return "lost";
  if (disposition === "converted") return "won";
  if (disposition === "no_answer") return "contacted";
  if (disposition === "documentation") return "documents_pending";
  if (disposition === "visa_in_process") return "applied";
  return "interested";
}

export function isLeadClosed(lead: {
  status: LeadStatus;
  disposition?: LeadDisposition;
}): boolean {
  return (
    lead.status === "won" ||
    lead.status === "lost" ||
    lead.disposition === "lost" ||
    lead.disposition === "converted"
  );
}

export function labelForStatus(status: string): string {
  return LEAD_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function statusColor(status: string): string {
  return LEAD_STATUSES.find((s) => s.value === status)?.color ?? "bg-gray-100 text-gray-800";
}
