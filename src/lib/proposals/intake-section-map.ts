import { SECTION_CATALOG, SECTION_KEYS } from "@/lib/ai/prompts";
import { proposalToIntake, type IntakeInput } from "@/lib/proposals/types";
import type { Proposal, ProposalSection } from "@/db/schema";

export type SectionKey = (typeof SECTION_KEYS)[number];

const ALL_SECTIONS: SectionKey[] = [...SECTION_KEYS];

/**
 * Which sections a change to each intake field can affect.
 * Fields not listed here (clientEmail, title) never affect generated prose.
 * The "ambiguous" fields (supportingMaterial, salespersonName, clientName,
 * companyName, dateOfCall) map to every section rather than a narrow guess,
 * since AI-SPEC.md itself describes their influence as "wherever facts belong".
 */
export const FIELD_TO_SECTIONS: Partial<Record<keyof IntakeInput, SectionKey[]>> = {
  clientNeedsSummary: ["introduction"],
  goals: ["introduction", "proposed_solution"],
  projectScope: ["proposed_solution"],
  recommendedServices: ["proposed_solution", "deliverables"],
  proposedTimeline: ["timeline"],
  timelinePhases: ["timeline"],
  currency: ["pricing"],
  proposedPrice: ["pricing"],
  priceRange: ["pricing"],
  pricingNotes: ["pricing"],
  supportingMaterial: ALL_SECTIONS,
  salespersonName: ALL_SECTIONS,
  clientName: ALL_SECTIONS,
  companyName: ALL_SECTIONS,
  dateOfCall: ALL_SECTIONS,
};

function stableValue(value: unknown): string {
  return JSON.stringify(value);
}

/** Which top-level intake fields differ between two intake snapshots. */
export function diffIntake(
  a: IntakeInput,
  b: IntakeInput,
): (keyof IntakeInput)[] {
  const changed: (keyof IntakeInput)[] = [];
  const keys = new Set<keyof IntakeInput>([
    ...(Object.keys(a) as (keyof IntakeInput)[]),
    ...(Object.keys(b) as (keyof IntakeInput)[]),
  ]);

  for (const key of keys) {
    if (key === "templateId") continue;
    const av = a[key];
    const bv = b[key];
    const differs =
      Array.isArray(av) || Array.isArray(bv) || typeof av === "object"
        ? stableValue(av) !== stableValue(bv)
        : av !== bv;
    if (differs) changed.push(key);
  }

  return changed;
}

/** Union the sections affected by a set of changed fields, in catalog order. */
export function sectionsAffectedByFields(
  fields: (keyof IntakeInput)[],
): SectionKey[] {
  const affected = new Set<SectionKey>();
  for (const field of fields) {
    for (const key of FIELD_TO_SECTIONS[field] ?? []) {
      affected.add(key);
    }
  }
  return SECTION_CATALOG.map((s) => s.key as SectionKey).filter((key) =>
    affected.has(key),
  );
}

/** Reverse of FIELD_TO_SECTIONS: which intake fields drive a given section. */
export function fieldsRelevantToSection(
  sectionKey: SectionKey,
): (keyof IntakeInput)[] {
  return (Object.keys(FIELD_TO_SECTIONS) as (keyof IntakeInput)[]).filter(
    (field) => FIELD_TO_SECTIONS[field]?.includes(sectionKey),
  );
}

/**
 * The subset of an intake snapshot that actually drives a given section —
 * used as the generation-cache key, so a match only requires the fields
 * relevant to *this* section to line up, not the whole intake.
 */
export function sectionRelevantSnapshot(
  intake: IntakeInput,
  sectionKey: SectionKey,
): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {};
  for (const field of fieldsRelevantToSection(sectionKey)) {
    snapshot[field] = intake[field];
  }
  return snapshot;
}

export type StaleSectionsResult = {
  toRegenerate: SectionKey[];
  skippedHumanEdited: SectionKey[];
};

/**
 * Sections whose driving intake fields changed since the proposal was last
 * (re)generated. Applies regardless of the proposal's current status — a
 * proposal can be edited after approval/send, and regenerating is what
 * correctly moves it back to `in_review` for re-approval. Only requires a
 * recorded generation baseline and at least one existing section; sections
 * a human has hand-edited since are always excluded so they're never
 * silently overwritten.
 */
export function getStaleSections(
  proposal: Proposal,
  sections: ProposalSection[],
): StaleSectionsResult {
  const empty: StaleSectionsResult = { toRegenerate: [], skippedHumanEdited: [] };

  if (!proposal.lastGeneratedIntakeSnapshot) return empty;
  if (sections.length === 0) return empty;

  const snapshot = proposal.lastGeneratedIntakeSnapshot as unknown as IntakeInput;
  const currentIntake = proposalToIntake(proposal);
  const changedFields = diffIntake(snapshot, currentIntake);
  const affected = sectionsAffectedByFields(changedFields);

  const sectionByKey = new Map(sections.map((s) => [s.key, s]));
  const toRegenerate: SectionKey[] = [];
  const skippedHumanEdited: SectionKey[] = [];

  for (const key of affected) {
    const row = sectionByKey.get(key);
    if (!row) continue;
    if (row.humanEdited) {
      skippedHumanEdited.push(key);
    } else {
      toRegenerate.push(key);
    }
  }

  return { toRegenerate, skippedHumanEdited };
}
