# Test scenarios & sample data

Concrete cases for manual QA and submission evidence. Mapped to [PRD.md](./PRD.md) testing requirements and current app behavior ([PHASES.md](./PHASES.md), [AI-SPEC.md](./AI-SPEC.md), [BUILD-PLAN-selective-intake-regen.md](./BUILD-PLAN-selective-intake-regen.md)).

**How to use:** create a draft at `/proposals/new`, paste the field values, run the steps, record Pass/Fail + screenshot or event log excerpt in your evidence table.

### Alternate data sets (same TCs, different companies)

| Set | File | Domain |
| --- | --- | --- |
| A (this file) | [TEST-SCENARIOS.md](./TEST-SCENARIOS.md) | Logistics — Northline |
| B | [TEST-SCENARIOS-set-b.md](./TEST-SCENARIOS-set-b.md) | EdTech — Meridian Learning |
| C | [TEST-SCENARIOS-set-c.md](./TEST-SCENARIOS-set-c.md) | Fintech — Harbor Pay |
| D | [TEST-SCENARIOS-set-d.md](./TEST-SCENARIOS-set-d.md) | Hospitality — Oak & Ember Hotels |
| Extract | [TEST-SCENARIOS-intake-extract.md](./TEST-SCENARIOS-intake-extract.md) | **Fill from a call summary** — paste / PDF / txt / md |

Use evidence ID prefixes `TC-*` (A), `B-TC-*`, `C-TC-*`, `D-TC-*`, `EX-*` (intake extract) so runs don’t collide.

---

## Evidence checklist (PRD)

| # | PRD scenario | Example IDs below |
| --- | --- | --- |
| 1 | Normal proposal generation | TC-01 |
| 2 | Missing information | TC-02, TC-03, TC-04 |
| 3 | Supporting material | TC-05 |
| 4 | Section regeneration | TC-06, TC-07, TC-08 |
| 5 | Human approval | TC-09 *(Phase 4+)* |
| 6 | Final delivery and logging | TC-10 *(Phase 5+)* |
| 7 | Failure handling | TC-11, TC-12 |

---

## Shared baseline: Northline Logistics (happy-path intake)

Use this as the complete intake for TC-01 and as the starting point for regen tests.

| Field | Value |
| --- | --- |
| Title | Proposal for Northline Logistics |
| Salesperson | Amara Okonkwo |
| Client name | Jordan Hale |
| Client email | jordan.hale@northlinelogistics.com |
| Company | Northline Logistics |
| Date of call | 2026-09-03 |
| Needs | Manual dispatch scheduling is slow and error-prone. Planners juggle spreadsheets, WhatsApp updates, and a legacy TMS, so same-day changes often miss drivers. |
| Scope | Design and implement a dispatch operations workspace: live job board, driver assignment rules, and a lightweight mobile status update flow integrated with their current TMS export. |
| Goals | Cut average dispatch time from 45 to under 15 minutes; Reduce missed same-day reassignments; Give ops a single source of truth for active jobs |
| Services | Discovery & process mapping; Dispatch workspace (web); Driver status mobile PWA; TMS CSV/API sync; 2-week hypercare |
| Timeline summary | 8 weeks from kickoff, including UAT and hypercare |
| Phases | 1 Discovery — duration `1 week`, window `1 week`; 2 Build — `4 weeks` / `5 weeks`; 3 UAT & hypercare — `3 weeks` / `3 weeks` |
| Currency | USD |
| Proposed price | 48000 |
| Price range | *(empty)* |
| Pricing notes | Fixed fee. Travel out of scope. Extra integrations billed separately. |
| Supporting material | Jordan said: “If a driver is stuck at the warehouse gate, we need that visible in under two minutes.” They currently export jobs from **FleetCore TMS** nightly as CSV. Peak season starts mid-November. |

---

## TC-01 — Normal proposal generation

**PRD:** 1  
**Goal:** Complete intake produces a clear six-section proposal.

**Steps**

1. Create draft with **Shared baseline** (all hard fields filled).
2. Open hub → **Generate with AI**.
3. Wait for redirect to preview (or open **Preview proposal**).

**Expect**

- Status → `in_review`.
- Six sections present: Introduction, Proposed Solution, Deliverables, Timeline, Pricing, Next Steps.
- Pricing mentions **48000** / USD (or equivalent), not invented figures.
- Timeline reflects 8 weeks / phases.
- Preview header shows Northline / Jordan / Amara / date.
- Activity: `generated` (and related) events.

**Evidence:** preview screenshot + hub status + event row.

---

## TC-02 — Missing pricing (clarification)

**PRD:** 2  
**Goal:** No fabricated prices; clarification path + red fields on intake.

**Steps**

1. Copy baseline but leave **Proposed price** and **Price range** empty; set **Pricing notes** to `Budget TBD after stakeholder review.`
2. Generate.

**Expect**

- Status → `needs_clarification`.
- Hub shows gaps / clarifying questions.
- No dollar amounts invented in any section that claim a firm quote.
- **Edit intake** highlights pricing fields in red with messages under them.

**Evidence:** clarification banner + intake red fields + section/GAP content if any.

---

## TC-03 — Missing timeline (clarification)

**PRD:** 2  

**Steps**

1. Baseline with **Timeline summary** empty and **all phases** empty (or phases with label only, no duration/window).
2. Keep pricing complete. Generate.

**Expect**

- `needs_clarification` focused on timeline.
- No invented durations (e.g. no sudden “6 weeks” unless in intake).
- Intake page highlights timeline summary / phases.

---

## TC-04 — Missing scope / needs (clarification)

**PRD:** 2  

**Steps**

1. Fill client/commercials but leave **Needs** or **Scope** empty.
2. Generate.

**Expect**

- Clarification for the empty hard field(s).
- No invented project scope or problem statement presented as fact.

---

## TC-05 — Supporting material usage

**PRD:** 3  
**Goal:** Distinctive pasted facts appear in relevant sections.

**Steps**

1. Use shorter clinic intake **or** baseline with this supporting material (keep unique marker):

   > Unique marker: **cobalt kestrel checklist**. Spanish language support is required for two clinics. EHR is Athena.

2. Generate. Search preview/edit HTML for the marker and Spanish / Athena.

**Expect**

- Marker appears in a relevant section (often solution/deliverables), not dumped as a raw dump-only block.
- Does not contradict intake scope.

**Variant (Bright Harbor):**

| Field | Value |
| --- | --- |
| Client / company | Priya Shah / Bright Harbor Clinics |
| Salesperson | Sam Rivera |
| Needs | Patient intake forms are paper-based; front desk re-enters data into EHR nightly. |
| Scope | Digital intake forms with EHR write-back for three clinic locations. |
| Goals | Eliminate double entry; Shorten check-in wait |
| Services | Form design; EHR integration; Staff training |
| Timeline summary | 6 weeks |
| Currency | USD |
| Price range | 22000–28000 |
| Proposed price | *(empty)* |
| Supporting material | **cobalt kestrel checklist**. Spanish required for two clinics. |

---

## TC-06 — Manual section edit (preserve others)

**PRD:** 4 (manual half)  

**Steps**

1. Complete TC-01.
2. On preview (or `/edit`), change **only** Deliverables body text; save.
3. Confirm Introduction / Pricing HTML unchanged.
4. Activity: `section_saved` (and title save if renamed).

**Expect**

- Only the edited section updates.
- `human_edited` behavior: later selective regen should **skip** that section (see TC-08).

---

## TC-07 — Selective regen after intake change

**PRD:** 4 + Phase 3 intake-diff plan  

**Steps**

1. Complete TC-01 (`in_review`).
2. Edit intake: change **only** Proposed price to `52000` (and notes if desired). Save.
3. On hub, confirm staleness banner lists **Pricing** (and only pricing, unless map expands).
4. Click **Regenerate these sections**.
5. Open preview: pricing reflects 52000; Introduction/Deliverables body unchanged (unless also listed).

**Expect**

- Banner before click; no Claude call until confirm.
- Activity: `intake_updated` + `section_regenerated` for pricing with `reason` related to intake update.
- Snapshot baseline updates so banner clears after successful regen.

**Variant A — timeline only:** change timeline summary to `10 weeks from kickoff` → expect **Timeline** only.  
**Variant B — email only:** change client email only → **no** regen banner (delivery-only field).

---

## TC-08 — Selective regen skips hand-edited sections

**PRD:** 4 + BUILD-PLAN hand-edit skip  

**Steps**

1. TC-01, then manually edit **Proposed Solution** and save (mark human-edited).
2. Edit intake: change **Project scope** (maps to proposed_solution) and/or **Recommended services**.
3. Hub banner should list affected sections but mark Proposed Solution as skipped / edited manually (or exclude it from regen list per product copy).
4. Regenerate → Proposed Solution text stays as human edit; Deliverables may regen if services changed.

**Expect**

- Hand-edited section content preserved.
- User can see why it was skipped.

---

## TC-09 — Approval gate (Phase 4+)

**PRD:** 5  

**Steps**

1. Proposal in `in_review`.
2. Attempt **Send to client** (or delivery action) before approve → rejected / disabled.
3. Request approval → `pending_approval` → Approve → `approved`.
4. Send now allowed.

**Expect**

- Hard gate: no client delivery unless `approved`.
- Events: `approval_requested`, `approved` / `rejected`.

*Skip until Phase 4 ships; note N/A in evidence if testing early.*

---

## TC-10 — Delivery + logging (Phase 5+)

**PRD:** 6  

**Steps (available now — preview export)**

1. Open a generated proposal preview → click **Export PDF**.
2. In the browser print dialog, choose **Save as PDF** (or Print).
3. Confirm hub/activity shows `pdf_generated` with method `print`.

**Steps (full Phase 5 — when server PDF + email ship)**

1. Approved proposal → server PDF → download and/or email with attachment.
2. Confirm `pdf_url` / storage and events `pdf_generated`, `email_sent`.
3. Status → `sent` on successful email path.

**Expect (preview export)**

- Print dialog shows proposal document only (no app chrome).
- Activity log includes export event.

*Server PDF / email may still be N/A until Phase 5 completes.*

---

## TC-11 — Generate failure (bad/missing API key)

**PRD:** 7  

**Steps**

1. Temporarily remove or invalidate `ANTHROPIC_API_KEY`; restart dev server.
2. Generate on a complete draft.

**Expect**

- Clear UI error on Generate step.
- `failed` event with debug message.
- Prior sections (if any) not wiped; intake intact.
- Restore key afterward.

---

## TC-12 — Partial failure during selective regen

**PRD:** 7  

**Steps**

1. TC-01, then change pricing (banner shows).
2. Break API key; click **Regenerate these sections**.

**Expect**

- New intake values remain saved.
- Unaffected sections still present.
- Failed event names the regen step; banner/error is debuggable.

---

## TC-13 — Phases-only timeline (no summary text)

**Goal:** Hard timeline check passes via phases alone.

**Steps**

1. Leave timeline summary blank.
2. Add phases with duration and/or delivery window (see baseline phases).
3. Complete pricing; generate.

**Expect**

- `in_review` (not clarification for timeline).
- Timeline section lists phases.

---

## TC-14 — Price range without firm price

**Steps**

1. Empty proposed price; set price range `10000–15000`, currency `EUR`.
2. Generate.

**Expect**

- OK generate; pricing section uses range + EUR, not a single invented firm quote.

---

## TC-15 — Preview before edit flow

**Steps**

1. Generate (TC-01).
2. Confirm landing on **full preview** before opening section editor.
3. Hub primary action is Preview; Edit is secondary.
4. Confirm **Export PDF** is available on the preview header when sections exist.

**Expect**

- Full composed document (header + all sections + sign-off) in the selected template skin.
- Export opens the browser print dialog (Save as PDF).

---

## TC-16 — Template skin selection + lock

**PRD / plan:** [BUILD-PLAN-templates.md](./BUILD-PLAN-templates.md)

**Goal:** Collage (or Navy) skin is chosen on intake, used on preview/print, and cannot be changed after generate.

**Steps**

1. New proposal → under **Proposal style**, select **Collage**.
2. Fill baseline intake (Northline) → create draft → generate.
3. Open preview: gray/blue accent rail and uppercase section titles (not Classic serif letter).
4. Open **Edit intake**: style cards are disabled / read-only; save does not switch template.
5. (Optional) New draft with **Navy** → generate → navy header band on preview.

**Expect**

- Preview `data-template` matches selection (`koya_collage` / `koya_navy` / `koya_classic`).
- After sections exist, changing template in the UI is blocked; DB `template_id` unchanged on save.
- Print/Export still shows the same skin cleanly.

**Evidence:** intake radio screenshot + preview screenshot after generate.

---

## Quick smoke path (minimum for a demo)

1. TC-01 (happy path)  
2. TC-02 (missing pricing)  
3. TC-05 (supporting material marker)  
4. TC-07 (selective pricing regen)  
5. TC-16 (template skin) if demoing styles  
6. TC-11 (failure) if time allows  

---

## Evidence table template

Copy into your submission sheet:

| ID | Scenario | Result (Pass/Fail) | Notes / artifact |
| --- | --- | --- | --- |
| TC-01 | Normal generation | | |
| TC-02 | Missing pricing | | |
| TC-03 | Missing timeline | | |
| TC-04 | Missing needs/scope | | |
| TC-05 | Supporting material | | |
| TC-06 | Manual section edit | | |
| TC-07 | Selective intake regen | | |
| TC-08 | Skip hand-edited | | |
| TC-09 | Approval gate | | |
| TC-10 | Delivery + logging | | |
| TC-11 | Generate failure | | |
| TC-12 | Regen failure | | |
| TC-13 | Phases-only timeline | | |
| TC-14 | Price range only | | |
| TC-15 | Preview-first flow | | |
| TC-16 | Template skin + lock | | |
