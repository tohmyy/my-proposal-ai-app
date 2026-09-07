# Koya Talent — AI Proposal App

Week 3 proposal application: intake → Claude generate → human review → approval → PDF/email.

## Specs

- [PRD.md](./PRD.md) — product brief
- [TDD.md](./TDD.md) — architecture & data model
- [AI-SPEC.md](./AI-SPEC.md) — Claude contracts & prompts
- [assets/](./assets/) — intake fields, proposal template, client email

## Phase 1 (current)

Next.js app with **Koya Ink** theme, Supabase/Postgres via Drizzle, proposal list, intake create/edit, and proposal hub (status + summary + events). No AI yet.

### Setup

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

### Routes

| Path | Purpose |
| --- | --- |
| `/` | Proposal list |
| `/proposals/new` | Intake form → create draft |
| `/proposals/[id]` | Hub (status, summary, activity) |
| `/proposals/[id]/intake` | Edit intake |

## Later phases

2. Claude generate + TipTap edit · 3. Section regen · 4. Approval · 5. PDF + Resend · 6. Deploy
