-- Agent profile fields: designation, last login, deleted status
-- Run in Supabase SQL editor

alter type agent_status add value if not exists 'deleted';

alter table profiles
  add column if not exists designation text not null default '',
  add column if not exists last_login_at timestamptz;
