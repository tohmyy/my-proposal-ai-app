# Koya Talent — AI Proposal App

Week 3 proposal application: intake → Claude generate → human review → approval → PDF/email.

## Specs & agent docs

| Doc | Purpose |
| --- | --- |
| [PRD.md](./PRD.md) | Product brief + test scenarios |
| [TDD.md](./TDD.md) | Architecture, data model, APIs |
| [AI-SPEC.md](./AI-SPEC.md) | Claude prompts, JSON contracts, guardrails |
| [PHASES.md](./PHASES.md) | Build phases — **start here for “what next”** |
| [DESIGN.md](./DESIGN.md) | Koya Ink visual system |
| [AGENTS.md](./AGENTS.md) | Instructions for coding agents |
| [assets/](./assets/) | Intake fields, proposal template, client email |

## Current status

See [PHASES.md](./PHASES.md). Phase 2 (Claude generate + TipTap) is done; **Phase 3** is next (section regeneration).

**Phase 2 env:** set `ANTHROPIC_API_KEY` in `.env` / `.env.local`, then restart `npm run dev`.

## Setup

1. Create a Supabase project.
2. Copy env file and fill values:

```bash
cp .env.example .env.local
```

Required for Phase 1:

- `DATABASE_URL` — Supabase Postgres URI (Settings → Database)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (used later for Storage; safe to set now)

3. Push schema:

```bash
npm run db:push
```

Or run [`drizzle/0000_phase1.sql`](./drizzle/0000_phase1.sql) in the Supabase SQL editor.  
If you already applied an older Phase 1 schema, run [`drizzle/0001_structured_intake.sql`](./drizzle/0001_structured_intake.sql) instead (or as well).

4. Start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Structured intake

- **Goals** and **recommended services** are string lists
- **Pricing** splits into proposed price, range, and notes (price *or* range required)
- **Timeline** is a summary text plus optional phases (`duration` / `deliveryWindow`)

### Routes (Phase 1–2)

| Path | Purpose |
| --- | --- |
| `/` | Proposal list |
| `/proposals/new` | Intake form → create draft |
| `/proposals/[id]` | Hub (status, generate, summary, activity) |
| `/proposals/[id]/intake` | Edit intake |
| `/proposals/[id]/preview` | Full proposal preview (review before edit) |
| `/proposals/[id]/edit` | TipTap section editor |
