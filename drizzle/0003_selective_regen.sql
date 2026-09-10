-- Support diffing intake changes against the last generated snapshot,
-- and tracking which sections a human has hand-edited since generation.
alter table proposals add column if not exists last_generated_intake_snapshot jsonb;
alter table proposal_sections add column if not exists human_edited boolean not null default false;
