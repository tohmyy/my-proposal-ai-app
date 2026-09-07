-- Phase 1 schema for Koya proposals (fresh install)
-- Or: npm run db:push with DATABASE_URL set

create extension if not exists "pgcrypto";

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'draft',
  title text,
  client_name text not null default '',
  client_email text not null default '',
  company_name text not null default '',
  date_of_call date,
  salesperson_name text not null default '',
  client_needs_summary text not null default '',
  project_scope text not null default '',
  goals jsonb not null default '[]'::jsonb,
  recommended_services jsonb not null default '[]'::jsonb,
  proposed_timeline text not null default '',
  timeline_phases jsonb not null default '[]'::jsonb,
  proposed_price text not null default '',
  price_range text not null default '',
  pricing_notes text not null default '',
  supporting_material text not null default '',
  template_id text not null default 'koya_v1',
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists proposal_sections (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  key text not null,
  title text not null,
  position integer not null,
  html_content text not null default '',
  updated_at timestamptz not null default now()
);

create unique index if not exists proposal_sections_proposal_id_key_idx
  on proposal_sections (proposal_id, key);

create table if not exists proposal_events (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  type text not null,
  message text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists proposals_updated_at_idx on proposals (updated_at desc);
create index if not exists proposal_events_proposal_id_idx on proposal_events (proposal_id);
