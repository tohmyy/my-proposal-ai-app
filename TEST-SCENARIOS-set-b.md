# Test scenarios — Set B (Meridian Learning)

Same cases as [TEST-SCENARIOS.md](./TEST-SCENARIOS.md) with different sample data. Use for a second pass of PRD evidence.

**How to use:** follow TC steps from the main file; substitute this set’s **Shared baseline** and TC-specific expect values.

---

## Shared baseline: Meridian Learning (EdTech)

| Field | Value |
| --- | --- |
| Title | Proposal for Meridian Learning |
| Salesperson | Chris Delgado |
| Client name | Naomi Brooks |
| Client email | naomi.brooks@meridianlearning.io |
| Company | Meridian Learning |
| Date of call | 2026-08-19 |
| Needs | Instructors manage cohorts across Notion, email, and a legacy LMS. Enrollment confirmations are manual, so learners often miss kickoff materials and live session links. |
| Scope | Build a cohort operations hub: automated enrollment emails, session calendar sync, attendance capture, and a simple instructor dashboard that pulls roster data from their existing LMS via CSV/API. |
| Goals | Cut enrollment admin time by 60%; Ensure every learner receives kickoff pack within 1 hour of signup; Give instructors one roster view per cohort |
| Services | Discovery workshop; Cohort ops web app; Email automation templates; LMS sync (CSV + webhook); Instructor training (2 sessions) |
| Timeline summary | 7 weeks from kickoff through pilot with two cohorts |
| Phases | 1 Discovery — `5 days` / `1 week`; 2 Build & integrations — `4 weeks` / `4 weeks`; 3 Pilot & iterate — `2 weeks` / `2 weeks` |
| Currency | GBP |
| Proposed price | 36000 |
| Price range | *(empty)* |
| Pricing notes | Fixed fee for two-cohort pilot. Additional LMS connectors quoted separately. |
| Supporting material | Naomi: “If a learner signs up Friday night, they still need Monday’s Zoom link without someone copying it by hand.” Stack today: **Canvas LMS** + Mailchimp. Marker phrase: **amber lantern syllabus**. |

---

## TC-01 — Normal proposal generation

**Steps:** Same as main TC-01 using this baseline.

**Expect**

- `in_review`; six sections.
- Pricing reflects **36000** / GBP (not invented USD-only defaults that ignore currency).
- Timeline ~7 weeks / three phases.
- Header: Meridian Learning / Naomi Brooks / Chris Delgado / 2026-08-19.

---

## TC-02 — Missing pricing

**Data:** Baseline with price + range empty; notes = `Budget TBD pending board review in October.`

**Expect:** `needs_clarification`; no fabricated GBP/USD quote; intake pricing fields highlighted red.

---

## TC-03 — Missing timeline

**Data:** Baseline; clear timeline summary and all phase duration/window fields.

**Expect:** Clarification on timeline; no invented “7 weeks” if removed from intake.

---

## TC-04 — Missing needs or scope

**Data:** Empty needs **or** empty scope; keep commercials filled.

**Expect:** Clarification for that hard field; no invented EdTech problem statement.

---

## TC-05 — Supporting material

**Marker:** **amber lantern syllabus** (+ Canvas / Mailchimp / Friday-night signup line).

**Alternate short intake (optional):**

| Field | Value |
| --- | --- |
| Client / company | Naomi Brooks / Meridian Learning |
| Needs | Cohort kickoff is manual and error-prone. |
| Scope | Automated enrollment + calendar + attendance for LMS-backed cohorts. |
| Timeline summary | 7 weeks |
| Currency | GBP |
| Price range | 30000–40000 |
| Supporting material | Must include **amber lantern syllabus**. |

**Expect:** Marker (and ideally Canvas/Mailchimp) appears in a relevant section.

---

## TC-06 — Manual section edit

Edit only **Deliverables**; save. Other sections unchanged; section marked human-edited for TC-08.

---

## TC-07 — Selective regen (pricing)

After TC-01, change proposed price to **39500** only → banner targets **Pricing** → regenerate → preview shows 39500; intro unchanged.

**Variant:** Change timeline summary to `9 weeks including buffer` → **Timeline** only.  
**Variant:** Change email only → no regen banner.

---

## TC-08 — Skip hand-edited

Hand-edit **Proposed Solution**, then change **Project scope** on intake. Regen skips human-edited solution (or lists as skipped).

---

## TC-09 / TC-10 — Approval & delivery

Same as main file (Phase 4+ / 5+). Use Meridian email for delivery tests when available.

---

## TC-11 / TC-12 — Failure handling

Same steps as main (bad API key on generate / selective regen). Intake and untouched sections preserved.

---

## TC-13 — Phases-only timeline

Empty summary; keep three phases with duration/window. Expect `in_review` with phased timeline section.

---

## TC-14 — Price range only

Empty proposed price; range `30000–40000`, currency `GBP`. Expect range + GBP in pricing; no single invented firm fee.

---

## TC-15 — Preview-first flow

Generate → land on full preview before editor; Meridian branding in header/sign-off.

---

## Evidence row prefix

Use IDs `B-TC-01` … `B-TC-15` in your evidence table to distinguish from Set A (main file).
