-- Append-only history of every version a section has ever had. Serves both
-- the per-section generation cache (matching fields_snapshot) and a
-- restorable version history UI.
create table if not exists proposal_section_revisions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  section_key text not null,
  title text not null,
  html_content text not null default '',
  fields_snapshot jsonb not null default '{}'::jsonb,
  source text not null,
  human_edited boolean not null default false,
  restored_from_revision_id uuid references proposal_section_revisions(id),
  created_at timestamptz not null default now()
);

create index if not exists proposal_section_revisions_lookup_idx
  on proposal_section_revisions (proposal_id, section_key, created_at);
