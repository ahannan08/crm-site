-- Run in Supabase SQL editor if schema was applied before WhatsApp reminders
-- Safe to run on fresh installs too (uses IF NOT EXISTS where possible)

alter table leads
  add column if not exists whatsapp_reminders_enabled boolean not null default true;

create table if not exists notification_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  milestone text not null check (milestone in ('due_in_2d', 'due_in_1d', 'due_today', 'overdue_1d')),
  sent_at timestamptz not null default now(),
  recipients text[] not null default '{}',
  unique (lead_id, milestone)
);

create index if not exists notification_logs_organization_id_idx on notification_logs(organization_id);
create index if not exists notification_logs_lead_id_idx on notification_logs(lead_id);

alter table notification_logs enable row level security;

drop policy if exists "notification_logs_deny_all" on notification_logs;
create policy "notification_logs_deny_all" on notification_logs for all using (false);
