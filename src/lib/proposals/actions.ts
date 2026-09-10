"use server";

import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { proposals, proposalEvents } from "@/db/schema";
import {
  displayTitle,
  getMissingHardFields,
  parseIntakeFormData,
} from "@/lib/proposals/types";

function emptyToNullDate(value: string | null | undefined) {
  if (!value || !value.trim()) return null;
  return value;
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
      currency: data.currency,
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
      currency: data.currency,
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
  revalidatePath(`/proposals/${id}/intake`);
  redirect(`/proposals/${id}/intake`);
}

const HEADER_FIELDS = [
  "clientName",
  "companyName",
  "salespersonName",
  "dateOfCall",
] as const;

export type ProposalHeaderField = (typeof HEADER_FIELDS)[number];

export async function saveProposalHeaderField(
  proposalId: string,
  field: ProposalHeaderField,
  value: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!HEADER_FIELDS.includes(field)) {
    return { ok: false, error: "Unknown field" };
  }

  const proposal = await getProposal(proposalId);
  if (!proposal) {
    return { ok: false, error: "Proposal not found" };
  }

  const trimmed = value.trim();

  if (field === "dateOfCall" && trimmed && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { ok: false, error: "Invalid date" };
  }

  const nextValues = {
    clientName: proposal.clientName,
    companyName: proposal.companyName,
    salespersonName: proposal.salespersonName,
    dateOfCall: proposal.dateOfCall,
  };

  switch (field) {
    case "dateOfCall":
      nextValues.dateOfCall = emptyToNullDate(trimmed);
      break;
    case "clientName":
      nextValues.clientName = trimmed;
      break;
    case "companyName":
      nextValues.companyName = trimmed;
      break;
    case "salespersonName":
      nextValues.salespersonName = trimmed;
      break;
  }

  const title = displayTitle({
    companyName: nextValues.companyName,
    clientName: nextValues.clientName,
  });

  await db
    .update(proposals)
    .set({ ...nextValues, title, updatedAt: new Date() })
    .where(eq(proposals.id, proposalId));

  await db.insert(proposalEvents).values({
    proposalId,
    type: "header_updated",
    message: `Updated ${field}.`,
    meta: { field },
  });

  revalidatePath("/");
  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath(`/proposals/${proposalId}/preview`);
  revalidatePath(`/proposals/${proposalId}/edit`);

  return { ok: true };
}

export async function listProposalEvents(proposalId: string) {
  return db
    .select()
    .from(proposalEvents)
    .where(eq(proposalEvents.proposalId, proposalId))
    .orderBy(desc(proposalEvents.createdAt));
}

export async function logProposalExport(
  proposalId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const proposal = await getProposal(proposalId);
  if (!proposal) {
    return { ok: false, error: "Proposal not found" };
  }

  await db.insert(proposalEvents).values({
    proposalId,
    type: "pdf_generated",
    message: "Proposal exported via browser Print / Save as PDF.",
    meta: { method: "print" },
  });

  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath(`/proposals/${proposalId}/preview`);
  return { ok: true };
}
