# Build phases

Track implementation against [PRD.md](./PRD.md) and [TDD.md](./TDD.md). Agents: do the **next incomplete** phase only unless the user explicitly expands scope.

**Current:** Phase 5 complete (server-side Chromium PDF + Supabase Storage + email attachment live). **Next:** Phase 6 (hardening, evidence, deploy).

---

## Phase 1 — Foundation + Koya Ink + intake CRUD

**Status:** Done

- [x] Next.js App Router scaffold (`src/`)
- [x] Koya Ink theme ([DESIGN.md](./DESIGN.md))
- [x] Drizzle schema + Supabase/Postgres wiring
- [x] Routes: `/`, `/proposals/new`, `/proposals/[id]`, `/proposals/[id]/intake`
- [x] Create/update intake + soft hard-field gaps + events
- [x] Structured intake: goals/services arrays, split pricing, optional timeline phases

**Exit:** Create and reopen drafts with polished UI.

---

## Phase 2 — Claude generate + TipTap edit

**Status:** Done

- [x] `@anthropic-ai/sdk` server-only; prompts/constants from [AI-SPEC.md](./AI-SPEC.md)
- [x] Zod schemas for generate response; Markdown → HTML → sanitize
- [x] Hub **Generate**: `generating` → `in_review` | `needs_clarification`
- [x] Clarification UI (gaps + clarifying questions)
- [x] `/proposals/[id]/edit`: TipTap; per-section **Save** + `section_saved` event
- [x] Persist six section keys from AI-SPEC / proposal template
- [x] *(explicit scope expansion, user-requested)* Inline click-to-edit directly on `/proposals/[id]/preview` — section body (TipTap), section titles, and header fields (prepared by/date/prepared for) all editable in place via Save/Cancel, reusing the same save actions and sanitize/event/revalidate pipeline. `/proposals/[id]/edit` is unchanged and kept as a fallback.

**Needs:** `ANTHROPIC_API_KEY` (+ optional `ANTHROPIC_MODEL`)

**Exit:** Complete intake → six sections; missing price/timeline → clarification; manual edits persist.

---

## Phase 3 — Section regeneration

**Status:** Done

**Plan:** [BUILD-PLAN-selective-intake-regen.md](./BUILD-PLAN-selective-intake-regen.md)

- [x] Per-section **Regenerate with AI** (engine) + optional instruction — `regenerateSection` in `src/lib/ai/regenerate.ts`
- [x] Intake diff (against `last_generated_intake_snapshot`) → regenerate **only** mapped, non-hand-edited sections, confirmed via a hub-page banner before any AI call
- [x] Replace only target `key`(s); other sections unchanged; sections a human has hand-edited are always skipped
- [x] Event `section_regenerated` (`meta.sectionKey`, `meta.reason`)
- [x] Manual per-section **Regenerate** button on both `/proposals/[id]/preview` (inline editor) and `/proposals/[id]/edit` (`SectionEditor`) — `regenerateOneSection` in `src/lib/proposals/generate-actions.ts`, no status gate (same precedent as `saveSectionHtml`), `meta.reason: "manual"`

**Exit:** PRD scenario 4 passes; intake edits don’t force a full regenerate.

---

## Phase 4 — Status machine + approval gate

**Status:** Done

- [x] Request approval / approve / reject per TDD transitions — `requestApproval`/`approveProposal`/`rejectProposal` in `src/lib/proposals/actions.ts`, each guarding on current status server-side
- [x] Approve surface: `/proposals/[id]/preview` — `RequestApprovalButton` (header, when `in_review`) and `ApprovalReviewPanel` (Approve / Reject-with-optional-reason, when `pending_approval`)
- [x] Block send/delivery unless `approved` — satisfied by the status machine itself; Phase 5's send action must check `status === "approved"` (no send/delivery UI exists yet to gate)
- [x] Events: `approval_requested`, `approved`, `rejected` (`meta.reason` when a rejection reason is given); hub shows a "Changes requested" banner when back in `in_review` after the most recent event is a rejection

**Exit:** Cannot send while `in_review`; can after approve (delivery in Phase 5).

---

## Phase 5 — Preview, PDF, email, storage

**Status:** Done — real server-side Chromium PDF rendering, Supabase Storage upload, and email attachment all built and verified locally (see TDD.md §11 item 3)

- [x] `/proposals/[id]/preview` with **Export PDF** (browser Print / Save as PDF + print CSS) — kept as a client-side fallback alongside the new server PDF, per TDD.md
- [x] `/proposals/[id]/preview?print=1` — a dedicated static-rendering path (`editable={false}` on `ProposalDocument`, zero client hydration) used only by the headless-Chromium capture, so the normal interactive preview is unaffected
- [x] Multi-template skins (`koya_classic` / `koya_collage` / `koya_navy`) — intake radio cards, `template_id` persistence, locked after generate; see [BUILD-PLAN-templates.md](./BUILD-PLAN-templates.md)
- [x] Server HTML → PDF → Supabase Storage → `pdf_url`: `src/lib/pdf/browser.ts` launches Chromium (full `playwright` locally; `playwright-core` + `@sparticuz/chromium` on Vercel/Lambda, selected via `process.env.VERCEL`/`AWS_LAMBDA_FUNCTION_NAME`), `src/lib/pdf/proposal-pdf.ts` renders via `page.emulateMedia({ media: "print" })` + `page.pdf(...)`, uploads to a **public** `proposal-pdfs` Storage bucket (no auth in this app, so signed URLs would only go stale — see the plan's design notes), and sets `proposals.pdfUrl`
- [x] Event `pdf_generated` with `meta.method: "server"` for evidence logging (both for a standalone hub-triggered render and for a render done as part of sending an email)
- [x] Hub **Generate PDF** button (`src/components/generate-pdf-button.tsx`) + conditional **Download PDF** link once `pdfUrl` is set — verified end-to-end: a real proposal renders a real `%PDF-1.4` file, uploaded to the actual Supabase project, downloadable via a stable public URL
- [x] Resend email **with PDF attachment**: `sendProposalEmail` always re-renders a fresh PDF before sending (freshness over trusting a possibly-stale `pdfUrl`) and attaches it; if rendering/upload fails, the send still proceeds with just the proposal link (graceful degradation — the link is the baseline, the attachment is the enhancement). Gated on `status === "approved"`; on success sets `sent` and logs `email_sent`; every failure path (not approved, no client email, `RESEND_API_KEY` unset, PDF render failure, Resend error) logs a `failed` event with a clear message.
- [x] Shared `getAppBaseUrl()` (`src/lib/app-url.ts`, `NEXT_PUBLIC_APP_URL` → `VERCEL_URL` → `localhost:3000`) used by both the email's proposal link and the internal Chromium navigation target, so the two can't silently diverge.

**Needs:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL` (see README). `RESEND_API_KEY` is **not configured in this dev environment**, so the send-succeeds path itself wasn't exercised — but with a dummy key set temporarily for verification, the PDF-render-and-attach step was confirmed to run and produce a real buffer before Resend's own auth check cleanly rejected the fake key, then reverted. The Vercel-only serverless Chromium code path (`@sparticuz/chromium` + `playwright-core`) **cannot run on this Windows dev machine at all** — it was built carefully against both packages' documented APIs and this Next.js version's `serverExternalPackages`/`maxDuration` docs, but is only truly confirmed once deployed to Vercel.

**Exit:** Approve → Generate PDF (or Send, which regenerates one) → real PDF in Supabase Storage, downloadable from the hub and attached to the client email → `sent`; failures clear, content preserved.

---

## Phase 6 — Hardening, evidence, deploy

**Status:** Not started

- [ ] Failure paths + visible event log for evidence
- [ ] Sample generated proposal for submission
- [ ] Vercel deploy (public app link)
- [ ] One-page ops/architecture doc
- [ ] Walk PRD test matrix (TDD §12)

**Exit:** Submission-ready deliverables from PRD.

---

## Notes for agents

- Update checkboxes and the **Current / Next** line at the top when a phase completes.
- Structured intake fields are locked; don’t revert to a single `estimated_pricing` blob.
- Section regeneration is Phase 3 — optional stretch inside Phase 2 only if the user asks.
