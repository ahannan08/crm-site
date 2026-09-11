import { isLeadClosed } from "./constants";
import type { Lead } from "./types";

export const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function computeOpenLeadsMetrics(leads: Lead[]) {
  const openLeads = leads.filter((l) => !isLeadClosed(l));
  const byMonth: Record<string, number> = Object.fromEntries(
    MONTH_SHORT.map((m) => [m, 0])
  );

  for (const lead of openLeads) {
    const d = new Date(lead.enquiry_date || lead.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const key = MONTH_SHORT[d.getMonth()];
    byMonth[key] = (byMonth[key] ?? 0) + 1;
  }

  return {
    openLeadsCount: openLeads.length,
    openLeadsByMonth: byMonth,
  };
}

export function computeLeadsByMonth(leads: Lead[]): Record<string, number> {
  const byMonth: Record<string, number> = Object.fromEntries(
    MONTH_SHORT.map((m) => [m, 0])
  );

  for (const lead of leads) {
    const d = new Date(lead.enquiry_date || lead.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const key = MONTH_SHORT[d.getMonth()];
    byMonth[key] = (byMonth[key] ?? 0) + 1;
  }

  return byMonth;
}
