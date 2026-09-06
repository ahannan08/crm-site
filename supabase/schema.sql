-- Multi-tenant Visa CRM schema
-- Run in Supabase SQL editor after creating your project

create type app_role as enum ('super_admin', 'admin', 'agent');
create type agent_status as enum ('active', 'inactive');
create type registration_status as enum ('pending', 'approved', 'rejected');
create type visa_type as enum ('visit', 'student', 'business');
create type lead_source as enum ('meta', 'justdial', 'walk_in', 'google_ads', 'website', 'referral', 'other');
create type lead_status as enum ('new', 'contacted', 'interested', 'documents_pending', 'applied', 'won', 'lost');
create type activity_type as enum ('call', 'note', 'status_change');
create type marital_status as enum ('single', 'married', 'divorced', 'widowed', 'other');

-- Organizations (tenants)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text not null default '',
  logo_url text not null default '',
  description text not null default '',
  created_at timestamptz not null default now()
);

-- Admin registration requests (before auth user exists)
create table registration_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company_name text not null,
  phone text not null default '',
  status registration_status not null default 'pending',
  setup_token uuid,
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

create unique index registration_requests_email_pending_idx
  on registration_requests (lower(email))
  where status = 'pending';

-- User profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  email text not null,
  phone text not null default '',
  app_role app_role not null default 'agent',
  agent_status agent_status default 'active',
  onboarding_complete boolean not null default false,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index profiles_organization_id_idx on profiles(organization_id);
create unique index profiles_email_idx on profiles(lower(email));

-- Leads (tenant-scoped)
create table leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  enquiry_date date not null default current_date,
  name text not null,
  phone text not null,
  email text not null default '',
  age int,
  city text not null default '',
  visa_type visa_type not null default 'visit',
  source lead_source not null default 'walk_in',
  marital_status marital_status,
  kids int,
  highest_qualification text not null default '',
  year_finished text not null default '',
  passport_expiry text not null default '',
  travel_history text not null default '',
  refusals text not null default '',
  country_of_choice text not null default '',
  occupation text not null default '',
  monthly_income text not null default '',
  savings text not null default '',
  itr text not null default '',
  property_details text not null default '',
  status lead_status not null default 'new',
  assigned_to uuid references profiles(id) on delete set null,
  next_follow_up_at timestamptz,
  whatsapp_reminders_enabled boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_organization_id_idx on leads(organization_id);
create index leads_status_idx on leads(status);
create index leads_assigned_to_idx on leads(assigned_to);
create index leads_next_follow_up_idx on leads(next_follow_up_at);

-- Activity log
create table activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  type activity_type not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index activities_lead_id_idx on activities(lead_id);
create index activities_organization_id_idx on activities(organization_id);

-- WhatsApp follow-up notification dedup (staff alerts only)
create table notification_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  milestone text not null check (milestone in ('due_in_2d', 'due_in_1d', 'due_today', 'overdue_1d')),
  sent_at timestamptz not null default now(),
  recipients text[] not null default '{}',
  unique (lead_id, milestone)
);

create index notification_logs_organization_id_idx on notification_logs(organization_id);
create index notification_logs_lead_id_idx on notification_logs(lead_id);

-- RLS
alter table organizations enable row level security;
alter table registration_requests enable row level security;
alter table profiles enable row level security;
alter table leads enable row level security;
alter table activities enable row level security;
alter table notification_logs enable row level security;

-- Helper: current user's org
create or replace function auth_user_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from profiles where id = auth.uid()
$$;

create or replace function auth_user_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select app_role from profiles where id = auth.uid()
$$;

-- Profiles: users see own org members; super_admin sees all
create policy "profiles_select" on profiles for select using (
  auth_user_role() = 'super_admin'
  or organization_id = auth_user_org_id()
  or id = auth.uid()
);

create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- Organizations: members read own org
create policy "organizations_select" on organizations for select using (
  auth_user_role() = 'super_admin'
  or id = auth_user_org_id()
);

-- Registration requests: super_admin only (service role used for public register)
create policy "registration_requests_super_admin" on registration_requests for all using (
  auth_user_role() = 'super_admin'
);

-- Leads: tenant isolation
create policy "leads_select" on leads for select using (
  organization_id = auth_user_org_id()
  or auth_user_role() = 'super_admin'
);

create policy "leads_insert" on leads for insert with check (
  organization_id = auth_user_org_id()
);

create policy "leads_update" on leads for update using (
  organization_id = auth_user_org_id()
);

create policy "leads_delete" on leads for delete using (
  organization_id = auth_user_org_id()
  and auth_user_role() = 'admin'
);

-- Activities: tenant isolation
create policy "activities_select" on activities for select using (
  organization_id = auth_user_org_id()
);

create policy "activities_insert" on activities for insert with check (
  organization_id = auth_user_org_id()
);

-- Notification logs: service role / cron only (no client access)
create policy "notification_logs_deny_all" on notification_logs for all using (false);
