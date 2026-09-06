import type { FollowUpMilestone } from "./types";

export const WHATSAPP_API_VERSION = "v21.0";

/** Meta template names — must match exactly after approval */
export const WHATSAPP_FOLLOWUP_TEMPLATES: Record<FollowUpMilestone, string> = {
  due_in_2d: "visa_followup_due_in_2d",
  due_in_1d: "visa_followup_due_in_1d",
  due_today: "visa_followup_due_today",
  overdue_1d: "visa_followup_overdue_1d",
};

export const FOLLOWUP_MILESTONES: {
  key: FollowUpMilestone;
  daysUntil: number;
}[] = [
  { key: "due_in_2d", daysUntil: 2 },
  { key: "due_in_1d", daysUntil: 1 },
  { key: "due_today", daysUntil: 0 },
  { key: "overdue_1d", daysUntil: -1 },
];

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  );
}

/** E.164 digits without + (e.g. 919876543210) */
export function normalizeWhatsAppPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

export function formatFollowUpDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Calendar date in IST as YYYY-MM-DD */
export function istDateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function daysUntilFollowUpInIst(followUpAt: string, now = new Date()): number {
  const followUpKey = istDateKey(new Date(followUpAt));
  const todayKey = istDateKey(now);
  const [fy, fm, fd] = followUpKey.split("-").map(Number);
  const [ty, tm, td] = todayKey.split("-").map(Number);
  const followUpUtc = Date.UTC(fy, fm - 1, fd);
  const todayUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((followUpUtc - todayUtc) / (24 * 60 * 60 * 1000));
}

export function milestoneForLead(
  followUpAt: string,
  now = new Date()
): FollowUpMilestone | null {
  const diff = daysUntilFollowUpInIst(followUpAt, now);
  const match = FOLLOWUP_MILESTONES.find((m) => m.daysUntil === diff);
  return match?.key ?? null;
}
