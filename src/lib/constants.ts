import type { LeadSource, LeadStatus, MaritalStatus, VisaType } from "./types";

export const VISA_TYPES: { value: VisaType; label: string }[] = [
  { value: "visit", label: "Visit Visa" },
  { value: "student", label: "Student Visa" },
  { value: "business", label: "Business Visa" },
];

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: "justdial", label: "JustDial" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "google_ads", label: "Google Ads" },
  { value: "website", label: "Website" },
  { value: "walk_in", label: "Walk-in" },
  { value: "referral", label: "Referral" },
  { value: "phone_call", label: "Phone Call" },
  { value: "other", label: "Other" },
];

export const MARITAL_STATUSES: { value: MaritalStatus; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
  { value: "other", label: "Other" },
];

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
  return LEAD_SOURCES.find((s) => s.value === source)?.label ?? source;
}

export function labelForVisaType(type: string): string {
  return VISA_TYPES.find((v) => v.value === type)?.label ?? type;
}

export function labelForStatus(status: string): string {
  return LEAD_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function statusColor(status: string): string {
  return LEAD_STATUSES.find((s) => s.value === status)?.color ?? "bg-gray-100 text-gray-800";
}
