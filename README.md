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

See [PHASES.md](./PHASES.md). Phases 1–5.5 are done; **Phase 6** is next (hardening, evidence, deploy).

**Phase 2 env:** set `ANTHROPIC_API_KEY` in `.env` / `.env.local`, then restart `npm run dev`.

**Phase 5 env (PDF + email delivery):** set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `NEXT_PUBLIC_APP_URL` (used both to build the proposal link in the client email and as the internal navigation target for server-side PDF rendering) in `.env` / `.env.local`, then restart `npm run dev`. Without `RESEND_API_KEY`, "Send to client" fails cleanly with a clear error instead of sending. Clicking **Generate PDF** on a proposal's hub page renders it server-side with headless Chromium and uploads it to a public Supabase Storage bucket (`proposal-pdfs`), setting `pdf_url`; a **Download PDF** link then appears on the hub. Sending an email always re-renders a fresh PDF and attaches it — if that render fails, the email still sends with just the proposal link. The browser Print/Save-as-PDF action on `/proposals/[id]/preview` remains available as a client-side fallback (see TDD.md §11 item 3). The serverless Chromium code path (`@sparticuz/chromium` + `playwright-core`) only runs on Vercel/Lambda; locally, the full `playwright` package (with its own managed Chromium) is used instead.

**Phase 5.5 (sender identity + email preview, added by user request):** visit `/settings` to configure your company name, designation, logo, "From" email, and email salutation wording — these show up in the proposal document's header/footer and in outgoing client emails, replacing the previously hardcoded "Koya Talent" everywhere except the app's own top-nav (left as-is on purpose). Clicking **Send to client** now opens a preview dialog showing the real subject/body before anything sends, where you can add CC/BCC and make light edits for that one send; nothing is saved from the dialog itself. No new env vars — `settings.fromEmail` overrides `RESEND_FROM_EMAIL` when set, otherwise the existing env var is used unchanged.

**Auth (added by user request):** the app now requires sign-in for every page except `/sign-in`, `/sign-up`, and the client-facing `/proposals/[id]/preview` link (kept public since it's what gets emailed to real clients — anonymous visitors there always see the static, read-only document with no editing/approval controls). Sign-up is self-service email+password via [better-auth](https://www.better-auth.com/); every new user is either `sales` or `approver`, decided automatically at signup by matching their email against the `APPROVER_EMAILS` allowlist below — there's no admin UI for changing roles. Only an `approver` can approve or reject a proposal in `pending_approval`; a `sales` user sees a "waiting for approval from a higher-up" message instead. Set these in `.env` / `.env.local`, then restart `npm run dev`:

- `BETTER_AUTH_SECRET` — random string, e.g. `openssl rand -hex 32`
- `BETTER_AUTH_URL` — same value as `NEXT_PUBLIC_APP_URL` (better-auth doesn't read that var itself)
- `APPROVER_EMAILS` — comma-separated list of emails to auto-assign the `approver` role at signup

Run `npm run db:push` (or [`drizzle/0006_auth.sql`](./drizzle/0006_auth.sql)) to create the new `user`/`session`/`account`/`verification` tables and the `proposal_events.actor_email` column.

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
