# Koya Talent — AI Proposal App

Week 3 proposal application: intake → Claude generate → human review → approval → PDF/email.

## Specs & agent docs

| Doc | Purpose |
| --- | --- |
| [PRD.md](./PRD.md) | Product brief + test scenarios |
| [TDD.md](./TDD.md) | Architecture, data model, APIs |
| [AI-SPEC.md](./AI-SPEC.md) | Claude prompts, JSON contracts, guardrails |
| [PHASES.md](./PHASES.md) | Build phases — **start here for “what next”** |
| [BUILD-PLAN-selective-intake-regen.md](./BUILD-PLAN-selective-intake-regen.md) | Phase 3 plan: regen only sections affected by intake diffs |
| [TEST-SCENARIOS.md](./TEST-SCENARIOS.md) | Manual QA cases + sample intake (Set A — Northline) |
| [TEST-SCENARIOS-set-b.md](./TEST-SCENARIOS-set-b.md) | Same TCs — Set B Meridian Learning |
| [TEST-SCENARIOS-set-c.md](./TEST-SCENARIOS-set-c.md) | Same TCs — Set C Harbor Pay |
| [TEST-SCENARIOS-set-d.md](./TEST-SCENARIOS-set-d.md) | Same TCs — Set D Oak & Ember Hotels |
| [DESIGN.md](./DESIGN.md) | Koya Ink visual system |
| [AGENTS.md](./AGENTS.md) | Instructions for coding agents |
| [assets/](./assets/) | Intake fields, proposal template, client email |

## Current status

See [PHASES.md](./PHASES.md). Phases 1–5 are done; **Phase 6** is next (hardening, evidence, deploy).

**Phase 2 env:** set `ANTHROPIC_API_KEY` in `.env` / `.env.local`, then restart `npm run dev`.

**Phase 5 env (PDF + email delivery):** set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `NEXT_PUBLIC_APP_URL` (used both to build the proposal link in the client email and as the internal navigation target for server-side PDF rendering) in `.env` / `.env.local`, then restart `npm run dev`. Without `RESEND_API_KEY`, "Send to client" fails cleanly with a clear error instead of sending. Clicking **Generate PDF** on a proposal's hub page renders it server-side with headless Chromium and uploads it to a public Supabase Storage bucket (`proposal-pdfs`), setting `pdf_url`; a **Download PDF** link then appears on the hub. Sending an email always re-renders a fresh PDF and attaches it — if that render fails, the email still sends with just the proposal link. The browser Print/Save-as-PDF action on `/proposals/[id]/preview` remains available as a client-side fallback (see TDD.md §11 item 3). The serverless Chromium code path (`@sparticuz/chromium` + `playwright-core`) only runs on Vercel/Lambda; locally, the full `playwright` package (with its own managed Chromium) is used instead.

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
- `SUPABASE_SERVICE_ROLE_KEY` (used for Storage — PDF upload — from Phase 5 onward; safe to set now)

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
