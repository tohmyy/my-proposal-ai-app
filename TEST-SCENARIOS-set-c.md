# Test scenarios — Set C (Harbor Pay)

Same cases as [TEST-SCENARIOS.md](./TEST-SCENARIOS.md) with different sample data (fintech / payments ops).

**How to use:** follow TC steps from the main file; substitute this set’s baseline and expect values.

---

## Shared baseline: Harbor Pay

| Field | Value |
| --- | --- |
| Title | Proposal for Harbor Pay |
| Salesperson | Lena Vogt |
| Client name | Marcus Chen |
| Client email | marcus.chen@harborpay.com |
| Company | Harbor Pay |
| Date of call | 2026-07-28 |
| Needs | Risk analysts reconcile chargebacks across three bank portals and Slack threads. Cases stall because evidence files live in personal drives and no one owns SLA clocks. |
| Scope | Deliver a chargeback case workspace: unified case queue, evidence checklist, SLA timers, role-based assignment, and export packages for bank portals. Integrate with their Stripe dispute webhooks for case creation. |
| Goals | Halve median chargeback handling time; Hit 95% on-time evidence submission; Eliminate “lost” evidence in personal folders |
| Services | Process mapping; Case workspace (web); Stripe dispute ingest; Evidence checklist templates; Ops training + 3-week hypercare |
| Timeline summary | 9 weeks from kickoff through hypercare |
| Phases | 1 Discovery & SLA design — `2 weeks` / `2 weeks`; 2 Build & Stripe ingest — `5 weeks` / `5 weeks`; 3 UAT & hypercare — `2 weeks` / `2 weeks` |
| Currency | USD |
| Proposed price | 67500 |
| Price range | *(empty)* |
| Pricing notes | Includes Stripe webhook ingest. Bank portal RPA automation is out of scope. |
| Supporting material | Marcus: “If Visa asks for proof by Thursday, the clock has to be visible on the case—not in someone’s head.” Current tools: Stripe Dashboard + shared Drive. Marker: **silver ferry ledger**. |

---

## TC-01 — Normal proposal generation

**Expect:** `in_review`; six sections; pricing **67500** USD; ~9 weeks / three phases; header Harbor Pay / Marcus / Lena / 2026-07-28; Stripe/chargeback themes grounded in intake.

---

## TC-02 — Missing pricing

Empty price + range; notes `Finance wants a range after Q3 close.` → clarification; no invented 67500.

---

## TC-03 — Missing timeline

Clear summary + phase timings → timeline clarification; no invented 9-week plan.

---

## TC-04 — Missing needs or scope

Empty needs or scope → clarification; no invented chargeback product pitch.

---

## TC-05 — Supporting material

**Marker:** **silver ferry ledger** (+ Visa Thursday / Stripe / Drive).

Optional compact intake: same company; timeline `9 weeks`; price range `60000–75000`; supporting material must include the marker.

---

## TC-06 — Manual section edit

Edit only **Timeline** body; save; others unchanged; human-edited for TC-08.

---

## TC-07 — Selective regen

Change price to **71000** → Pricing only regenerates.  
Or change goals list (add “Reduce repeat disputes”) → expect sections mapped to goals (`introduction`, `proposed_solution` per map).  
Email-only change → no banner.

---

## TC-08 — Skip hand-edited

Hand-edit **Pricing**, then change `pricingNotes` on intake. Regen should skip Pricing (human-edited) while banner explains skip.

---

## TC-09 / TC-10 — Approval & delivery

Same as main (Phase 4+ / 5+). Delivery address: marcus.chen@harborpay.com.

---

## TC-11 / TC-12 — Failure handling

Same as main file.

---

## TC-13 — Phases-only timeline

No summary; three timed phases → `in_review`; timeline lists phases.

---

## TC-14 — Price range only

Range `60000–75000`, currency USD, empty firm price → pricing uses range only.

---

## TC-15 — Preview-first flow

Full preview shows Harbor Pay proposal before section editor.

---

## Evidence row prefix

Use IDs `C-TC-01` … `C-TC-15`.
