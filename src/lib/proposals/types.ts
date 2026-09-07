import { z } from "zod";
import type { TimelinePhase } from "@/db/schema";

export const timelinePhaseSchema = z.object({
  phase: z.number().int().positive(),
  label: z.string().trim().optional().default(""),
  duration: z.string().trim().optional().default(""),
  deliveryWindow: z.string().trim().optional().default(""),
});

export const intakeSchema = z.object({
  clientName: z.string().trim().default(""),
  clientEmail: z.union([
    z.literal(""),
    z.string().trim().email("Enter a valid email"),
  ]),
  companyName: z.string().trim().default(""),
  dateOfCall: z.string().trim().optional().nullable(),
  salespersonName: z.string().trim().default(""),
  clientNeedsSummary: z.string().trim().default(""),
  projectScope: z.string().trim().default(""),
  goals: z.array(z.string().trim()).default([]),
  recommendedServices: z.array(z.string().trim()).default([]),
  proposedTimeline: z.string().trim().default(""),
  timelinePhases: z.array(timelinePhaseSchema).default([]),
  proposedPrice: z.string().trim().default(""),
  priceRange: z.string().trim().default(""),
  pricingNotes: z.string().trim().default(""),
  supportingMaterial: z.string().trim().default(""),
  title: z.string().trim().optional().nullable(),
});

export type IntakeInput = z.infer<typeof intakeSchema>;

/** Logical hard checks (not always 1:1 with a single column). */
export type HardIntakeField =
  | "clientNeedsSummary"
  | "projectScope"
  | "timeline"
  | "pricing";

export const HARD_FIELD_LABELS: Record<HardIntakeField, string> = {
  clientNeedsSummary: "Summary of client's needs",
  projectScope: "Project scope",
  timeline: "Proposed timeline (summary or phases)",
  pricing: "Proposed price or price range",
};

function phaseHasTiming(phase: TimelinePhase | IntakeInput["timelinePhases"][number]) {
  return Boolean(
    (phase.duration && String(phase.duration).trim()) ||
      (phase.deliveryWindow && String(phase.deliveryWindow).trim()),
  );
}

export function hasUsableTimeline(intake: IntakeInput): boolean {
  if (intake.proposedTimeline?.trim()) return true;
  return intake.timelinePhases.some(phaseHasTiming);
}

export function hasUsablePricing(intake: IntakeInput): boolean {
  return Boolean(intake.proposedPrice?.trim() || intake.priceRange?.trim());
}

export function getMissingHardFields(intake: IntakeInput): HardIntakeField[] {
  const missing: HardIntakeField[] = [];
  if (!intake.clientNeedsSummary?.trim()) missing.push("clientNeedsSummary");
  if (!intake.projectScope?.trim()) missing.push("projectScope");
  if (!hasUsableTimeline(intake)) missing.push("timeline");
  if (!hasUsablePricing(intake)) missing.push("pricing");
  return missing;
}

export function parseStringListJson(raw: FormDataEntryValue | null): string[] {
  if (!raw || typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function parseTimelinePhasesJson(
  raw: FormDataEntryValue | null,
): TimelinePhase[] {
  if (!raw || typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => {
        const row = item as Record<string, unknown>;
        return {
          phase:
            typeof row.phase === "number" && row.phase > 0
              ? row.phase
              : index + 1,
          label: String(row.label ?? "").trim(),
          duration: String(row.duration ?? "").trim(),
          deliveryWindow: String(
            row.deliveryWindow ?? row.delivery_window ?? "",
          ).trim(),
        };
      })
      .filter(
        (p) => p.label || p.duration || p.deliveryWindow,
      );
  } catch {
    return [];
  }
}

export function parseIntakeFormData(formData: FormData) {
  return intakeSchema.safeParse({
    clientName: formData.get("clientName"),
    clientEmail: formData.get("clientEmail"),
    companyName: formData.get("companyName"),
    dateOfCall: formData.get("dateOfCall") || null,
    salespersonName: formData.get("salespersonName"),
    clientNeedsSummary: formData.get("clientNeedsSummary"),
    projectScope: formData.get("projectScope"),
    goals: parseStringListJson(formData.get("goalsJson")),
    recommendedServices: parseStringListJson(
      formData.get("recommendedServicesJson"),
    ),
    proposedTimeline: formData.get("proposedTimeline"),
    timelinePhases: parseTimelinePhasesJson(formData.get("timelinePhasesJson")),
    proposedPrice: formData.get("proposedPrice"),
    priceRange: formData.get("priceRange"),
    pricingNotes: formData.get("pricingNotes"),
    supportingMaterial: formData.get("supportingMaterial"),
    title: formData.get("title") || null,
  });
}

export function proposalToIntake(proposal: {
  clientName: string;
  clientEmail: string;
  companyName: string;
  dateOfCall: string | null;
  salespersonName: string;
  clientNeedsSummary: string;
  projectScope: string;
  goals: string[];
  recommendedServices: string[];
  proposedTimeline: string;
  timelinePhases: TimelinePhase[];
  proposedPrice: string;
  priceRange: string;
  pricingNotes: string;
  supportingMaterial: string;
  title: string | null;
}): IntakeInput {
  return {
    clientName: proposal.clientName,
    clientEmail: proposal.clientEmail,
    companyName: proposal.companyName,
    dateOfCall: proposal.dateOfCall,
    salespersonName: proposal.salespersonName,
    clientNeedsSummary: proposal.clientNeedsSummary,
    projectScope: proposal.projectScope,
    goals: proposal.goals ?? [],
    recommendedServices: proposal.recommendedServices ?? [],
    proposedTimeline: proposal.proposedTimeline,
    timelinePhases: (proposal.timelinePhases ?? []).map((p, i) => ({
      phase: p.phase || i + 1,
      label: p.label ?? "",
      duration: p.duration ?? "",
      deliveryWindow: p.deliveryWindow ?? "",
    })),
    proposedPrice: proposal.proposedPrice,
    priceRange: proposal.priceRange,
    pricingNotes: proposal.pricingNotes,
    supportingMaterial: proposal.supportingMaterial,
    title: proposal.title,
  };
}

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  generating: "Generating",
  needs_clarification: "Needs clarification",
  in_review: "In review",
  pending_approval: "Pending approval",
  approved: "Approved",
  sent: "Sent",
  failed: "Failed",
};
