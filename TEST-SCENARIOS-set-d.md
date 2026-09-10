# Test scenarios — Set D (Oak & Ember Hotels)

Same cases as [TEST-SCENARIOS.md](./TEST-SCENARIOS.md) with different sample data (hospitality / guest ops).

**How to use:** follow TC steps from the main file; substitute this set’s baseline and expect values.

---

## Shared baseline: Oak & Ember Hotels

| Field | Value |
| --- | --- |
| Title | Proposal for Oak & Ember Hotels |
| Salesperson | Priya Nair |
| Client name | Elena Rossi |
| Client email | elena.rossi@oakandember.com |
| Company | Oak & Ember Hotels |
| Date of call | 2026-09-01 |
| Needs | Front desk and housekeeping coordinate room readiness via radio and paper boards. Guests wait for rooms that are clean but not marked ready, especially during Saturday check-in peaks. |
| Scope | Implement a room-status board shared across front desk and housekeeping: room states (dirty / in-progress / inspect / ready), mobile updates for housekeepers, and a front-desk “ready soon” queue. Integrate with their Opera PMS room list export. |
| Goals | Reduce average wait-for-room from 40 to under 15 minutes on peak days; Improve housekeeper update compliance to 90%+; Give managers a live house view |
| Services | On-site discovery (2 properties); Room status web + mobile; Opera CSV/API sync; Floor-plan board UI; Training + 2-week go-live support |
| Timeline summary | 6 weeks for pilot at two properties, then rollout playbook |
| Phases | 1 Discovery on-site — `1 week` / `1 week`; 2 Build & Opera sync — `3 weeks` / `3 weeks`; 3 Pilot go-live — `2 weeks` / `2 weeks` |
| Currency | EUR |
| Proposed price | 42000 |
| Price range | *(empty)* |
| Pricing notes | Pilot covers two properties. Extra properties priced per-site after pilot. Hardware (tablets) excluded. |
| Supporting material | Elena: “Housekeeping should tap Ready without walking back to the desk phone.” PMS: **Opera Cloud**. Peak: Saturdays after 14:00. Marker: **copper bell turnover**. |

---

## TC-01 — Normal proposal generation

**Expect:** `in_review`; six sections; **42000** EUR; ~6 weeks / three phases; header Oak & Ember / Elena / Priya / 2026-09-01; Opera / room-status themes from intake only.

---

## TC-02 — Missing pricing

Empty price + range; notes `Ownership wants options after summer season.` → clarification; no invented EUR quote.

---

## TC-03 — Missing timeline

Clear summary + phases → timeline clarification; no invented 6-week plan.

---

## TC-04 — Missing needs or scope

Empty needs or scope → clarification; no invented hotel product story.

---

## TC-05 — Supporting material

**Marker:** **copper bell turnover** (+ Opera Cloud / Saturday 14:00 / tap Ready).

Optional compact intake: same company; timeline `6 weeks`; price range `38000–46000` EUR; supporting material must include the marker.

---

## TC-06 — Manual section edit

Edit only **Introduction**; save; others unchanged.

---

## TC-07 — Selective regen

Change currency notes / price to **45000** → Pricing regenerates.  
Change supporting material (add “Need Italian UI labels on housekeeper app”) → sections per map (often broad if supportingMaterial maps widely—confirm banner list).  
Title-only change → no regen banner.

---

## TC-08 — Skip hand-edited

Hand-edit **Deliverables**, then change recommended services on intake. Deliverables skipped if human-edited; other mapped sections may regen.

---

## TC-09 / TC-10 — Approval & delivery

Same as main (Phase 4+ / 5+). Email: elena.rossi@oakandember.com.

---

## TC-11 / TC-12 — Failure handling

Same as main file.

---

## TC-13 — Phases-only timeline

No summary; timed phases only → `in_review`.

---

## TC-14 — Price range only

Range `38000–46000`, currency EUR → pricing uses range + EUR.

---

## TC-15 — Preview-first flow

Full preview for Oak & Ember before opening editor.

---

## Evidence row prefix

Use IDs `D-TC-01` … `D-TC-15`.
