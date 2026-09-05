-- Supabase schema for cloud migration (Phase 2+)
-- Run this in Supabase SQL editor when ready to move off local JSON

create type visa_type as enum ('visit', 'student', 'business');
create type lead_source as enum ('justdial', 'facebook', 'instagram', 'google_ads', 'website', 'walk_in', 'referral', 'phone_call', 'other');
create type lead_status as enum ('new', 'contacted', 'interested', 'documents_pending', 'applied', 'won', 'lost');
create type user_role as enum ('admin', 'agent');
create type activity_type as enum ('call', 'note', 'status_change');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role user_role not null default 'agent',
  created_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null default '',
  city text not null default '',
  visa_type visa_type not null,
  source lead_source not null,
  status lead_status not null default 'new',
  assigned_to uuid references profiles(id) on delete set null,
  next_follow_up_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  type activity_type not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index leads_status_idx on leads(status);
create index leads_assigned_to_idx on leads(assigned_to);
create index leads_next_follow_up_idx on leads(next_follow_up_at);
create index activities_lead_id_idx on activities(lead_id);
