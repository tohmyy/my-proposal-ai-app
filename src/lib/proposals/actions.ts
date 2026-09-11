"use server";

import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { db } from "@/db";
import { proposals, proposalEvents, type Proposal } from "@/db/schema";
import { getAppBaseUrl } from "@/lib/app-url";
import { renderAndStoreProposalPdf } from "@/lib/pdf/proposal-pdf";
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

function revalidateProposalPaths(proposalId: string) {
  revalidatePath("/");
  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath(`/proposals/${proposalId}/preview`);
  revalidatePath(`/proposals/${proposalId}/edit`);
  revalidatePath(`/proposals/${proposalId}/intake`);
}

export async function requestApproval(
  proposalId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const proposal = await getProposal(proposalId);
  if (!proposal) {
    return { ok: false, error: "Proposal not found" };
  }
  if (proposal.status !== "in_review") {
    return { ok: false, error: "Proposal is not ready for approval" };
  }

  await db
    .update(proposals)
    .set({ status: "pending_approval", updatedAt: new Date() })
    .where(eq(proposals.id, proposalId));

  await db.insert(proposalEvents).values({
    proposalId,
    type: "approval_requested",
    message: "Approval requested.",
    meta: null,
  });

  revalidateProposalPaths(proposalId);
  return { ok: true };
}

export async function approveProposal(
  proposalId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const proposal = await getProposal(proposalId);
  if (!proposal) {
    return { ok: false, error: "Proposal not found" };
  }
  if (proposal.status !== "pending_approval") {
    return { ok: false, error: "Proposal is not pending approval" };
  }

  await db
    .update(proposals)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(proposals.id, proposalId));

  await db.insert(proposalEvents).values({
    proposalId,
    type: "approved",
    message: "Proposal approved.",
    meta: null,
  });

  revalidateProposalPaths(proposalId);
  return { ok: true };
}

export async function rejectProposal(
  proposalId: string,
  reason?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const proposal = await getProposal(proposalId);
  if (!proposal) {
    return { ok: false, error: "Proposal not found" };
  }
  if (proposal.status !== "pending_approval") {
    return { ok: false, error: "Proposal is not pending approval" };
  }

  const trimmedReason = reason?.trim() || "";

  await db
    .update(proposals)
    .set({ status: "in_review", updatedAt: new Date() })
    .where(eq(proposals.id, proposalId));

  await db.insert(proposalEvents).values({
    proposalId,
    type: "rejected",
    message: trimmedReason
      ? `Changes requested: ${trimmedReason}`
      : "Changes requested.",
    meta: trimmedReason ? { reason: trimmedReason } : null,
  });

  revalidateProposalPaths(proposalId);
  return { ok: true };
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

/**
 * Plain-text body matching assets/client-email-template.md's structure.
 * The proposal link is always included; sendProposalEmail additionally
 * attaches a freshly rendered PDF when generation succeeds (see below).
 */
function buildProposalEmail(proposal: Proposal, proposalLink: string) {
  const companyName = proposal.companyName?.trim() || "your company";
  const clientName = proposal.clientName?.trim() || "there";
  const salespersonName = proposal.salespersonName?.trim() || "Koya Talent";

  const subject = `Proposal for ${companyName}`;
  const text = `Hi ${clientName},

Thanks again for taking the time to speak with us. Based on our conversation, we have put together a customized proposal for your review.

You can view the proposal here: ${proposalLink}

This document outlines the project scope, timeline, pricing details, and recommended approach.

If you have any questions or would like to make adjustments, feel free to reach out. We are happy to iterate with you.

Looking forward to hearing your thoughts.

Best regards,

${salespersonName}

Koya Talent`;

  return { subject, text };
}

export async function sendProposalEmail(
  proposalId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const proposal = await getProposal(proposalId);
  if (!proposal) {
    return { ok: false, error: "Proposal not found" };
  }

  async function fail(error: string, step: string) {
    await db.insert(proposalEvents).values({
      proposalId,
      type: "failed",
      message: `Send to client failed: ${error}`,
      meta: { step },
    });
    revalidatePath(`/proposals/${proposalId}`);
    return { ok: false as const, error };
  }

  if (proposal.status !== "approved") {
    return fail("Proposal must be approved before it can be sent.", "send_email");
  }

  const clientEmail = proposal.clientEmail?.trim();
  if (!clientEmail) {
    return fail("No client email on file — add one in intake first.", "send_email");
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return fail(
      "Email service is not configured (RESEND_API_KEY is not set).",
      "send_email",
    );
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || "proposals@example.com";
  const proposalLink = `${getAppBaseUrl()}/proposals/${proposalId}/preview`;
  const { subject, text } = buildProposalEmail(proposal, proposalLink);

  // PDF attachment is best-effort: a rendering hiccup shouldn't block the
  // client from getting the proposal at all, since the link above already
  // gives them access — see the "graceful degradation" design note.
  let attachmentBuffer: Buffer | null = null;
  try {
    const { buffer } = await renderAndStoreProposalPdf(proposalId);
    attachmentBuffer = buffer;
    await db.insert(proposalEvents).values({
      proposalId,
      type: "pdf_generated",
      message: "Rendered PDF for email attachment.",
      meta: { method: "server" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown PDF error";
    await db.insert(proposalEvents).values({
      proposalId,
      type: "failed",
      message: `PDF generation for email failed: ${message}`,
      meta: { step: "generate_pdf" },
    });
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: fromAddress,
      to: clientEmail,
      subject,
      text,
      ...(attachmentBuffer
        ? { attachments: [{ filename: "proposal.pdf", content: attachmentBuffer }] }
        : {}),
    });

    if (result.error) {
      return fail(result.error.message, "send_email");
    }

    await db
      .update(proposals)
      .set({ status: "sent", updatedAt: new Date() })
      .where(eq(proposals.id, proposalId));

    await db.insert(proposalEvents).values({
      proposalId,
      type: "email_sent",
      message: `Proposal emailed to ${clientEmail}.`,
      meta: { to: clientEmail, resendId: result.data?.id },
    });

    revalidateProposalPaths(proposalId);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    return fail(message, "send_email");
  }
}
