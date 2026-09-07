"use server";

import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { proposals, proposalEvents } from "@/db/schema";
import {
  getMissingHardFields,
  parseIntakeFormData,
} from "@/lib/proposals/types";

function emptyToNullDate(value: string | null | undefined) {
  if (!value || !value.trim()) return null;
  return value;
}

function displayTitle(input: {
  title?: string | null;
  companyName: string;
  clientName: string;
}) {
  if (input.title?.trim()) return input.title.trim();
  if (input.companyName.trim()) return `Proposal for ${input.companyName.trim()}`;
  if (input.clientName.trim()) return `Proposal for ${input.clientName.trim()}`;
  return "Untitled proposal";
}

export async function listProposals() {
  return db
    .select()
    .from(proposals)
    .orderBy(desc(proposals.updatedAt));
}

export async function getProposal(id: string) {
  const rows = await db
    .select()
    .from(proposals)
    .where(eq(proposals.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createProposal(formData: FormData) {
  const parsed = parseIntakeFormData(formData);

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid intake",
    };
  }

  const data = parsed.data;
  const title = displayTitle(data);

  const [created] = await db
    .insert(proposals)
    .values({
      status: "draft",
      title,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      companyName: data.companyName,
      dateOfCall: emptyToNullDate(data.dateOfCall),
      salespersonName: data.salespersonName,
      clientNeedsSummary: data.clientNeedsSummary,
      projectScope: data.projectScope,
      goals: data.goals,
      recommendedServices: data.recommendedServices,
      proposedTimeline: data.proposedTimeline,
      timelinePhases: data.timelinePhases,
      proposedPrice: data.proposedPrice,
      priceRange: data.priceRange,
      pricingNotes: data.pricingNotes,
      supportingMaterial: data.supportingMaterial,
    })
    .returning();

  const missing = getMissingHardFields(data);
  await db.insert(proposalEvents).values({
    proposalId: created.id,
    type: "created",
    message:
      missing.length > 0
        ? `Draft created. Soft gaps: ${missing.join(", ")}.`
        : "Draft created with complete hard fields.",
    meta: { missingHardFields: missing },
  });

  revalidatePath("/");
  redirect(`/proposals/${created.id}`);
}

export async function updateProposalIntake(id: string, formData: FormData) {
  const parsed = parseIntakeFormData(formData);

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid intake",
    };
  }

  const data = parsed.data;
  const title = displayTitle(data);
  const missing = getMissingHardFields(data);

  await db
    .update(proposals)
    .set({
      title,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      companyName: data.companyName,
      dateOfCall: emptyToNullDate(data.dateOfCall),
      salespersonName: data.salespersonName,
      clientNeedsSummary: data.clientNeedsSummary,
      projectScope: data.projectScope,
      goals: data.goals,
      recommendedServices: data.recommendedServices,
      proposedTimeline: data.proposedTimeline,
      timelinePhases: data.timelinePhases,
      proposedPrice: data.proposedPrice,
      priceRange: data.priceRange,
      pricingNotes: data.pricingNotes,
      supportingMaterial: data.supportingMaterial,
      updatedAt: new Date(),
    })
    .where(eq(proposals.id, id));

  await db.insert(proposalEvents).values({
    proposalId: id,
    type: "intake_updated",
    message:
      missing.length > 0
        ? `Intake updated. Soft gaps: ${missing.join(", ")}.`
        : "Intake updated. Hard fields complete.",
    meta: { missingHardFields: missing },
  });

  revalidatePath("/");
  revalidatePath(`/proposals/${id}`);
  redirect(`/proposals/${id}`);
}

export async function listProposalEvents(proposalId: string) {
  return db
    .select()
    .from(proposalEvents)
    .where(eq(proposalEvents.proposalId, proposalId))
    .orderBy(desc(proposalEvents.createdAt));
}
