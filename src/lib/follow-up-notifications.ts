import { isLeadClosed, labelForServiceType } from "./constants";
import {
  addMockNotificationLog,
  getMockLeadsForWhatsAppReminders,
  getUserById,
  getUsers,
  hasMockNotificationLog,
} from "./db";
import { createAdminClient, isSupabaseAdminConfigured } from "./supabase/admin";
import { sendWhatsAppTemplate } from "./whatsapp-api";
import {
  WHATSAPP_FOLLOWUP_TEMPLATES,
  formatFollowUpDateTime,
  isWhatsAppConfigured,
  milestoneForLead,
} from "./whatsapp-config";
import type { FollowUpMilestone, Lead, User } from "./types";

export interface FollowUpNotificationRunResult {
  scanned: number;
  sent: number;
  skipped: number;
  errors: string[];
  dryRun: boolean;
}

interface StaffRecipient {
  phone: string;
  label: string;
}

function buildTemplateParams(lead: Lead, agentName: string): string[] {
  return [
    lead.name,
    lead.phone,
    labelForServiceType(lead),
    lead.country_of_choice || "—",
    lead.next_follow_up_at ? formatFollowUpDateTime(lead.next_follow_up_at) : "—",
    agentName,
  ];
}

function collectStaffRecipients(
  admins: User[],
  assignedAgent: User | undefined
): StaffRecipient[] {
  const seen = new Set<string>();
  const out: StaffRecipient[] = [];

  for (const admin of admins) {
    const phone = admin.phone?.trim();
    if (!phone || seen.has(phone)) continue;
    seen.add(phone);
    out.push({ phone, label: admin.name });
  }

  if (assignedAgent?.phone?.trim()) {
    const phone = assignedAgent.phone.trim();
    if (!seen.has(phone)) {
      seen.add(phone);
      out.push({ phone, label: assignedAgent.name });
    }
  }

  return out;
}

async function sendMilestoneNotifications(
  lead: Lead,
  milestone: FollowUpMilestone,
  recipients: StaffRecipient[],
  agentName: string,
  logFn: (recipients: string[]) => Promise<void>
): Promise<{ sent: number; errors: string[] }> {
  const templateName = WHATSAPP_FOLLOWUP_TEMPLATES[milestone];
  const params = buildTemplateParams(lead, agentName);
  const errors: string[] = [];
  let sent = 0;

  for (const recipient of recipients) {
    const result = await sendWhatsAppTemplate(recipient.phone, templateName, params);
    if (result.ok) {
      sent += 1;
    } else {
      errors.push(`${recipient.label} (${recipient.phone}): ${result.error}`);
    }
  }

  if (sent > 0) {
    await logFn(recipients.map((r) => r.phone));
  }

  return { sent, errors };
}

async function runSupabaseNotifications(): Promise<FollowUpNotificationRunResult> {
  const admin = createAdminClient();
  const result: FollowUpNotificationRunResult = {
    scanned: 0,
    sent: 0,
    skipped: 0,
    errors: [],
    dryRun: !isWhatsAppConfigured(),
  };

  const { data: leads, error: leadsError } = await admin
    .from("leads")
    .select("*")
    .eq("whatsapp_reminders_enabled", true)
    .not("next_follow_up_at", "is", null);

  if (leadsError) {
    result.errors.push(leadsError.message);
    return result;
  }

  const eligible = ((leads ?? []) as (Lead & { organization_id: string })[]).filter(
    (l) => !isLeadClosed(l)
  );
  result.scanned = eligible.length;

  for (const lead of eligible) {
    if (!lead.next_follow_up_at) {
      result.skipped += 1;
      continue;
    }

    const milestone = milestoneForLead(lead.next_follow_up_at);
    if (!milestone) {
      result.skipped += 1;
      continue;
    }

    const { data: existing } = await admin
      .from("notification_logs")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("milestone", milestone)
      .maybeSingle();

    if (existing) {
      result.skipped += 1;
      continue;
    }

    const [{ data: admins }, { data: agentProfile }] = await Promise.all([
      admin
        .from("profiles")
        .select("id, name, email, phone, app_role, agent_status, joined_at")
        .eq("organization_id", lead.organization_id!)
        .eq("app_role", "admin"),
      lead.assigned_to
        ? admin
            .from("profiles")
            .select("id, name, email, phone, app_role, agent_status, joined_at")
            .eq("id", lead.assigned_to)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const adminUsers: User[] = (admins ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? "",
      password: "",
      role: "admin" as const,
      joined_at: row.joined_at,
    }));

    const assignedAgent: User | undefined = agentProfile
      ? {
          id: agentProfile.id,
          name: agentProfile.name,
          email: agentProfile.email,
          phone: agentProfile.phone ?? "",
          password: "",
          role: "agent",
          agent_status: agentProfile.agent_status ?? undefined,
          joined_at: agentProfile.joined_at,
        }
      : undefined;

    const recipients = collectStaffRecipients(adminUsers, assignedAgent);
    if (recipients.length === 0) {
      result.skipped += 1;
      result.errors.push(`Lead ${lead.name}: no admin/agent phone in org`);
      continue;
    }

    const agentName = assignedAgent?.name ?? "Unassigned";
    const { sent, errors } = await sendMilestoneNotifications(
      lead,
      milestone,
      recipients,
      agentName,
      async (phones) => {
        await admin.from("notification_logs").insert({
          organization_id: lead.organization_id,
          lead_id: lead.id,
          milestone,
          recipients: phones,
        });
      }
    );

    result.sent += sent;
    result.errors.push(...errors);
  }

  return result;
}

async function runMockNotificationsAsync(): Promise<FollowUpNotificationRunResult> {
  const result: FollowUpNotificationRunResult = {
    scanned: 0,
    sent: 0,
    skipped: 0,
    errors: [],
    dryRun: !isWhatsAppConfigured(),
  };

  const leads = getMockLeadsForWhatsAppReminders();
  result.scanned = leads.length;
  const users = getUsers();
  const admins = users.filter((u) => u.role === "admin");

  for (const lead of leads) {
    if (!lead.next_follow_up_at) {
      result.skipped += 1;
      continue;
    }

    const milestone = milestoneForLead(lead.next_follow_up_at);
    if (!milestone) {
      result.skipped += 1;
      continue;
    }

    if (hasMockNotificationLog(lead.id, milestone)) {
      result.skipped += 1;
      continue;
    }

    const assignedAgent = lead.assigned_to
      ? getUserById(lead.assigned_to)
      : undefined;
    const recipients = collectStaffRecipients(admins, assignedAgent);

    if (recipients.length === 0) {
      result.skipped += 1;
      result.errors.push(`Lead ${lead.name}: no admin/agent phone`);
      continue;
    }

    const agentName = assignedAgent?.name ?? "Unassigned";
    const { sent, errors } = await sendMilestoneNotifications(
      lead,
      milestone,
      recipients,
      agentName,
      async (phones) => {
        addMockNotificationLog(lead.id, milestone, phones);
      }
    );

    result.sent += sent;
    result.errors.push(...errors);
  }

  return result;
}

export async function runFollowUpNotifications(): Promise<FollowUpNotificationRunResult> {
  if (isSupabaseAdminConfigured()) {
    return runSupabaseNotifications();
  }
  return runMockNotificationsAsync();
}
