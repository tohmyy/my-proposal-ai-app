# Build phases

Track implementation against [PRD.md](./PRD.md) and [TDD.md](./TDD.md). Agents: do the **next incomplete** phase only unless the user explicitly expands scope.

**Current:** Phase 2 complete. **Next:** Phase 3 (section regeneration).

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

**Status:** Not started

- [ ] Per-section **Regenerate with AI** + optional instruction
- [ ] Replace only target `key`; other sections unchanged
- [ ] Event `section_regenerated`

**Exit:** PRD scenario 4 passes.

---

## Phase 4 — Status machine + approval gate

**Status:** Not started

- [ ] Request approval / approve / reject per TDD transitions
- [ ] Approve surface (hub or `/proposals/[id]/approve`)
- [ ] Block send/delivery unless `approved`
- [ ] Events: `approval_requested`, `approved`, `rejected`

**Exit:** Cannot send while `in_review`; can after approve (delivery in Phase 5).

---

## Phase 5 — Preview, PDF, email, storage

**Status:** Not started

- [ ] `/proposals/[id]/preview` + `templates/koya_v1.css`
- [ ] HTML → PDF; store in Supabase Storage; set `pdf_url`
- [ ] Resend email with PDF attachment (client email template)
- [ ] Hub download PDF; events `pdf_generated`, `email_sent`, `failed`

**Needs:** `RESEND_API_KEY`, storage bucket, PDF renderer decision from TDD

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
