# Koya Talent — AI Proposal App

Week 3 proposal application: intake → Claude generate → human review → approval → PDF/email.

## Specs & agent docs

| Doc | Purpose |
| --- | --- |
| [ONE-PAGER.md](./ONE-PAGER.md) | One-page submission doc — problem, pipeline, usage, gaps |
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

**Phase 5 env (PDF + email delivery):** set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `NEXT_PUBLIC_APP_URL` in `.env` / `.env.local` (and in the **Vercel project env** for production). `NEXT_PUBLIC_APP_URL` is the public origin used in client emails and for server-side PDF rendering. On Vercel, if you leave it unset, the app falls back to `VERCEL_PROJECT_PRODUCTION_URL`, then `VERCEL_URL` — preview/`*.vercel.app` deployment URLs are often behind **Deployment Protection** (Vercel login), so clients cannot open the link. Set `NEXT_PUBLIC_APP_URL` to your real public URL (e.g. `https://your-app.vercel.app` or a custom domain), set `BETTER_AUTH_URL` to the same value, redeploy, and disable Deployment Protection on **Production** (Project → Settings → Deployment Protection) so `/proposals/[id]/preview` is reachable without a Vercel account. Without `RESEND_API_KEY`, "Send to client" fails cleanly. **Generate PDF** uploads to Supabase Storage (`proposal-pdfs`); email re-renders and attaches a fresh PDF (or degrades to link-only if render fails). Browser Print on preview remains a fallback.

**Phase 5.5 (sender identity + email preview, added by user request):** visit `/settings` to configure your company name, designation, logo, "From" email, and email salutation wording — these show up in the proposal document's header/footer and in outgoing client emails, replacing the previously hardcoded "Koya Talent" everywhere except the app's own top-nav (left as-is on purpose). Clicking **Send to client** now opens a preview dialog showing the real subject/body before anything sends, where you can add CC/BCC and make light edits for that one send; nothing is saved from the dialog itself. No new env vars — `settings.fromEmail` overrides `RESEND_FROM_EMAIL` when set, otherwise the existing env var is used unchanged.

**Auth (added by user request):** the app now requires sign-in for every page except `/sign-in`, `/sign-up`, and the client-facing `/proposals/[id]/preview` link (kept public since it's what gets emailed to real clients — anonymous visitors there always see the static, read-only document with no editing/approval controls). Sign-up is self-service email+password via [better-auth](https://www.better-auth.com/); every new user is either `sales` or `approver`, decided automatically at signup by matching their email against the `APPROVER_EMAILS` allowlist below — there's no admin UI for changing roles. Only an `approver` can approve or reject a proposal in `pending_approval`; a `sales` user sees a "waiting for approval from a higher-up" message instead. Set these in `.env` / `.env.local`, then restart `npm run dev`:

- `BETTER_AUTH_SECRET` — random string, e.g. `openssl rand -hex 32`
- `BETTER_AUTH_URL` — same value as `NEXT_PUBLIC_APP_URL` (better-auth doesn't read that var itself)
- `APPROVER_EMAILS` — comma-separated list of emails to auto-assign the `approver` role at signup

Run `npm run db:push` (or [`drizzle/0006_auth.sql`](./drizzle/0006_auth.sql)) to create the new `user`/`session`/`account`/`verification` tables and the `proposal_events.actor_email` column.

**AI intake extraction (added by user request):** on the new-proposal and edit-intake forms, open **"Fill from a call summary"** to paste raw call notes or upload a PDF/`.txt`/`.md` document — Claude extracts whatever intake fields it can find (client name, needs, scope, goals, timeline, pricing, etc.) and pre-fills the empty fields in the form for you to review before saving; fields it can't find are left blank rather than guessed. Nothing is written to the database until you save normally — this only pre-fills the same form you'd otherwise type into by hand, and it never overwrites a field you've already filled in. No new env vars — it reuses `ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL`. `.docx` uploads aren't supported (PDF and plain text/Markdown only).

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
