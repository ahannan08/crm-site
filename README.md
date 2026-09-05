# Visa CRM

Simple web CRM for visa consultancies — track leads, follow-ups, and conversions.

## Features (Phase 1)

- **Dashboard** — stats, charts by source/visa type/status, follow-ups due, recent leads
- **Lead management** — create, edit, search, filter by visa type, source, status
- **Follow-ups** — today's calls, overdue list, click-to-call
- **Activity log** — log calls and notes per lead
- **Team login** — Admin sees all leads; Agents see assigned leads only

## Quick start

```bash
cd visa-crm
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo accounts

| Role  | Email           | Password  |
|-------|-----------------|-----------|
| Admin | admin@visa.com  | admin123  |
| Agent | priya@visa.com  | agent123  |

## Visa types

- Visit Visa
- Student Visa
- Business Visa

## Lead sources

JustDial, Facebook, Instagram, Google Ads, Website, Walk-in, Referral, Phone Call, Other

## Data storage

Phase 1 uses a local JSON file at `data/db.json` (auto-seeded from `data/seed.json` on first run).

For cloud deployment, see `supabase/schema.sql` to migrate to Supabase PostgreSQL.

## Pages

| Page        | URL              |
|-------------|------------------|
| Login       | `/login`         |
| Dashboard   | `/dashboard`     |
| All Leads   | `/leads`         |
| Add Lead    | `/leads/new`     |
| Lead Detail | `/leads/[id]`    |
| Follow-ups  | `/follow-ups`    |
