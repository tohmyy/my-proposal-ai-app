-- Migrate Phase 1 flat text intake → structured intake
-- Run in Supabase SQL editor if the old columns already exist.
-- Safe to skip on a fresh install that used the updated 0000_phase1.sql.

alter table proposals add column if not exists goals jsonb not null default '[]'::jsonb;
alter table proposals add column if not exists timeline_phases jsonb not null default '[]'::jsonb;
alter table proposals add column if not exists proposed_price text not null default '';
alter table proposals add column if not exists price_range text not null default '';
alter table proposals add column if not exists pricing_notes text not null default '';

-- Migrate legacy text columns when present
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'proposals' and column_name = 'goals_and_objectives'
  ) then
    update proposals
    set goals = case
      when coalesce(trim(goals_and_objectives), '') = '' then '[]'::jsonb
      else jsonb_build_array(goals_and_objectives)
    end
    where goals = '[]'::jsonb;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_name = 'proposals' and column_name = 'recommended_services'
      and data_type = 'text'
  ) then
    -- Rename old text column aside, recreate as jsonb
    alter table proposals rename column recommended_services to recommended_services_legacy;
    alter table proposals add column recommended_services jsonb not null default '[]'::jsonb;
    update proposals
    set recommended_services = case
      when coalesce(trim(recommended_services_legacy), '') = '' then '[]'::jsonb
      else jsonb_build_array(recommended_services_legacy)
    end;
    alter table proposals drop column recommended_services_legacy;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_name = 'proposals' and column_name = 'estimated_pricing'
  ) then
    update proposals
    set pricing_notes = estimated_pricing
    where coalesce(trim(pricing_notes), '') = ''
      and coalesce(trim(estimated_pricing), '') <> '';
    alter table proposals drop column estimated_pricing;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_name = 'proposals' and column_name = 'goals_and_objectives'
  ) then
    alter table proposals drop column goals_and_objectives;
  end if;
end $$;
