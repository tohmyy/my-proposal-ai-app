# Build plan: Selective section regen on intake update

**Status:** Implemented
**Related:** [PHASES.md](./PHASES.md) Phase 3, [AI-SPEC.md](./AI-SPEC.md) §8–9, [TDD.md](./TDD.md)
**Last updated:** 2026-09-09

When intake is saved on a proposal that already has generated sections, diffing the previous vs new intake and mapping changed fields to affected section keys makes it possible to regenerate **only** those sections. Unrelated sections stay untouched, and so do any sections a human has hand-edited since generation.

---

## Behavior (locked)

- **Scope:** only `in_review` proposals with existing `proposal_sections` rows and a recorded generation baseline (`proposals.last_generated_intake_snapshot`). `draft`/`generating`/`needs_clarification`/`pending_approval`/`approved`/`sent` proposals are unaffected — intake saves there behave exactly as before this feature existed. `needs_clarification` proposals still require the existing full **Generate** button, which re-evaluates the whole proposal rather than a subset.
- **Trigger:** saving intake (`updateProposalIntake`) never itself calls Claude — it only persists the new fields, exactly as before. Staleness is derived live, wherever it's shown, by diffing the current intake against `last_generated_intake_snapshot` (the exact intake used the last time sections were written). This means multiple intake edits made between regenerations correctly accumulate, since the baseline is a real persisted snapshot rather than "the row right before this specific edit."
- **Confirm before regenerating:** the hub page (`src/app/proposals/[id]/page.tsx`) shows a banner naming the affected sections with a **"Regenerate these sections"** button. No AI call happens until it's clicked. Clicking it re-validates staleness fresh server-side (never trusts a client-side list) before doing anything.
- **Hand-edited sections are always skipped:** each `proposal_sections` row has `human_edited` (set `true` by the manual save paths `saveSectionHtml`/`saveSectionTitle`, and reset to `false` whenever AI writes a section, whether via full generate or this selective regen). A section with `human_edited = true` is never included in `toRegenerate`, no matter what changed — it's surfaced instead as "skipped, edited manually" in the banner so the user knows why it wasn't touched.
- **Header-only / delivery-only fields** (`clientEmail`, `title`): never trigger section regen — they don't appear in generated prose.

```mermaid
flowchart TD
  save[Save intake] --> hub[Hub page renders]
  hub --> diff[Diff snapshot vs current intake]
  diff -->|no in_review, no baseline, or no diff| plain[No banner]
  diff -->|affected keys minus hand-edited| banner[Banner + Regenerate button]
  banner -->|click| regen[Regen each non-hand-edited key]
  regen --> preview[Redirect preview]
```

---

## Field → section map

Implemented in `src/lib/proposals/intake-section-map.ts` (`FIELD_TO_SECTIONS`), aligned with AI-SPEC §9:

| Changed intake field(s) | Sections to regenerate |
| --- | --- |
| `clientNeedsSummary` | `introduction` |
| `goals` | `introduction`, `proposed_solution` |
| `projectScope` | `proposed_solution` |
| `recommendedServices` | `proposed_solution`, `deliverables` |
| `proposedTimeline`, `timelinePhases` | `timeline` |
| `currency`, `proposedPrice`, `priceRange`, `pricingNotes` | `pricing` |
| `supportingMaterial` | *all six sections* — AI-SPEC describes its influence as "wherever facts belong," so it's treated conservatively rather than guessed narrowly |
| `salespersonName`, `clientName`, `companyName`, `dateOfCall` | *all six sections* — same conservative treatment; these can surface in personalized prose anywhere, not just one section |
| `clientEmail`, `title` | *(none)* |

**Diff helpers:** `diffIntake` in `intake-section-map.ts` — string equality for scalars, JSON-stable compare for `goals`, `recommendedServices`, `timelinePhases`. `sectionsAffectedByFields` unions the mapped sections and orders them per `SECTION_CATALOG`.

---

## AI: section regenerate (Phase 3 engine)

`src/lib/ai/regenerate.ts` — `regenerateSection(intake, currentSections, targetKey, instruction?)`:

- **Inputs:** full intake, all current section texts (for context/consistency), target `key`, optional instruction (default: "Update this section to reflect the latest intake changes.").
- Uses a dedicated system prompt (`REGENERATE_SECTION_SYSTEM_PROMPT` in `src/lib/ai/prompts.ts`) and a single-section Anthropic tool (`submitSectionTool` / `regenerateSectionResponseSchema` in `src/lib/ai/schema.ts`) — output is `{ key, title, content }` only.
- **Pipeline:** Markdown → sanitize → upsert, reusing `markdownToHtml` and `upsertSections` from `src/lib/proposals/generate-actions.ts`.
- Exported standalone so a future manual per-section "Regenerate" button can call the same function.

**Batch on confirm click:** sequential regen for affected keys (avoids conflicting writes, and lets later sections see earlier ones' fresh content).

**Events:**

- Per section: `section_regenerated` with `meta: { sectionKey, reason: "intake_update" }`.
- The batch keeps the proposal at `in_review` throughout (`generating` only transiently while the batch runs), matching TDD's `in_review → in_review` self-loop for "Manual save or section regen."

---

## Implementation

- `src/lib/proposals/intake-section-map.ts` — `FIELD_TO_SECTIONS`, `diffIntake`, `sectionsAffectedByFields`.
- `src/lib/ai/regenerate.ts` — Claude single-section regen.
- `src/lib/proposals/generate-actions.ts` — `getStaleSections(proposal, sections)` (pure, reused by both the hub page's display and the action's own re-validation) and `regenerateAffectedSections(proposalId)`. `upsertSections` sets `human_edited: false`; `saveSectionHtml`/`saveSectionTitle` set it `true`; `generateProposal` records `last_generated_intake_snapshot`.
- `src/components/regenerate-sections-button.tsx` + hub page banner — confirm-first UI.
- `drizzle/0003_selective_regen.sql` — `proposals.last_generated_intake_snapshot`, `proposal_sections.human_edited`.

---

## Out of scope

- A manual **Regenerate** control on preview/edit for a single section — `regenerateSection` is written to be reusable for that, but no UI is added for it yet.
- Any change to full-generate's behavior or the `needs_clarification` flow.
- Price XOR / min–max restructuring (separate change).
