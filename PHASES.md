# Build phases

Track implementation against [PRD.md](./PRD.md) and [TDD.md](./TDD.md). Agents: do the **next incomplete** phase only unless the user explicitly expands scope.

**Current:** Phase 4 complete. **Next:** finish Phase 5 (server PDF + email delivery).

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

**Status:** Partial — preview print export shipped

- [x] `/proposals/[id]/preview` with **Export PDF** (browser Print / Save as PDF + print CSS)
- [x] Event `pdf_generated` with `meta.method: "print"` for evidence logging
- [ ] Server HTML → PDF; store in Supabase Storage; set `pdf_url`
- [ ] Resend email with PDF attachment (client email template)
- [ ] Hub download of server-generated PDF; events `email_sent`, `failed`

**Needs (remaining):** `RESEND_API_KEY`, storage bucket, server PDF renderer (Playwright / Chromium) when replacing print fallback for email attachments

**Exit:** Approve → PDF → email/download → `sent`; failures clear, content preserved.

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
