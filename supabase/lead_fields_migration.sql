-- Run in Supabase SQL editor for existing projects

create type lead_disposition as enum (
  'no_answer',
  'follow_up',
  'visited',
  'lost',
  'converted',
  'documentation',
  'visa_in_process',
  'meeting_booked'
);

alter table leads add column if not exists disposition lead_disposition not null default 'no_answer';
alter table leads add column if not exists service_type text not null default '';
alter table leads add column if not exists cva_score text not null default '';
alter table leads add column if not exists lr_score smallint check (lr_score is null or (lr_score >= 1 and lr_score <= 5));

create index if not exists leads_disposition_idx on leads(disposition);
