"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { proposalEvents, proposalSections, proposals } from "@/db/schema";
import { generateProposalContent } from "@/lib/ai/generate";
import { markdownToHtml, sanitizeProposalHtml } from "@/lib/ai/html";
import { SECTION_CATALOG } from "@/lib/ai/prompts";
import { regenerateSection } from "@/lib/ai/regenerate";
import { getProposal } from "@/lib/proposals/actions";
import {
  getStaleSections,
  type SectionKey,
} from "@/lib/proposals/intake-section-map";
import { proposalToIntake } from "@/lib/proposals/types";

export type GenerateResult =
  | {
      ok: true;
      status: "in_review" | "needs_clarification";
      gaps: { field: string; message: string }[];
      clarifyingQuestions: string[];
      sectionCount: number;
    }
  | { ok: false; error: string };

async function upsertSections(
  proposalId: string,
  sections: { key: string; title: string; content: string }[],
) {
  for (const section of sections) {
    const catalog = SECTION_CATALOG.find((s) => s.key === section.key);
    if (!catalog) continue;

    const html = markdownToHtml(section.content);
    if (!html.trim() && !section.content.trim()) continue;

    const existing = await db
      .select({ id: proposalSections.id })
      .from(proposalSections)
      .where(
        and(
          eq(proposalSections.proposalId, proposalId),
          eq(proposalSections.key, section.key),
        ),
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(proposalSections)
        .set({
          title: section.title || catalog.title,
          htmlContent: html,
          position: catalog.position,
          humanEdited: false,
          updatedAt: new Date(),
        })
        .where(eq(proposalSections.id, existing[0].id));
    } else {
      await db.insert(proposalSections).values({
        proposalId,
        key: section.key,
        title: section.title || catalog.title,
        position: catalog.position,
        htmlContent: html,
        humanEdited: false,
      });
    }
  }
}

export async function generateProposal(proposalId: string): Promise<GenerateResult> {
  const proposal = await getProposal(proposalId);
  if (!proposal) {
    return { ok: false, error: "Proposal not found" };
  }

  await db
    .update(proposals)
    .set({ status: "generating", updatedAt: new Date() })
    .where(eq(proposals.id, proposalId));

  try {
    const intake = proposalToIntake(proposal);
    const result = await generateProposalContent(intake);

    if (result.sections.length > 0) {
      await upsertSections(proposalId, result.sections);
    }

    const nextStatus =
      result.status === "ok" ? "in_review" : "needs_clarification";

    await db
      .update(proposals)
      .set({
        status: nextStatus,
        lastGeneratedIntakeSnapshot:
          result.sections.length > 0 ? intake : proposal.lastGeneratedIntakeSnapshot,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));

    await db.insert(proposalEvents).values({
      proposalId,
      type: result.status === "ok" ? "generated" : "clarification_needed",
      message:
        result.status === "ok"
          ? `Generated ${result.sections.length} section(s).`
          : `Clarification needed (${result.gaps.length} gap(s)). ${result.clarifying_questions[0] ?? ""}`.trim(),
      meta: {
        gaps: result.gaps,
        clarifyingQuestions: result.clarifying_questions,
        sectionKeys: result.sections.map((s) => s.key),
      },
    });

    revalidatePath("/");
    revalidatePath(`/proposals/${proposalId}`);
    revalidatePath(`/proposals/${proposalId}/edit`);
    revalidatePath(`/proposals/${proposalId}/preview`);

    return {
      ok: true,
      status: nextStatus,
      gaps: result.gaps,
      clarifyingQuestions: result.clarifying_questions,
      sectionCount: result.sections.length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";

    await db
      .update(proposals)
      .set({
        status: proposal.status === "generating" ? "draft" : proposal.status,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));

    // Restore prior non-generating status more carefully
    const fallbackStatus =
      proposal.status === "generating" || proposal.status === "draft"
        ? "draft"
        : proposal.status === "needs_clarification"
          ? "needs_clarification"
          : proposal.status === "in_review"
            ? "in_review"
            : "draft";

    await db
      .update(proposals)
      .set({ status: fallbackStatus, updatedAt: new Date() })
      .where(eq(proposals.id, proposalId));

    await db.insert(proposalEvents).values({
      proposalId,
      type: "failed",
      message: `Generate proposal failed: ${message}`,
      meta: { step: "generate" },
    });

    revalidatePath(`/proposals/${proposalId}`);
    return { ok: false, error: message };
  }
}

export async function listSections(proposalId: string) {
  return db
    .select()
    .from(proposalSections)
    .where(eq(proposalSections.proposalId, proposalId))
    .orderBy(asc(proposalSections.position));
}

export async function saveSectionHtml(
  proposalId: string,
  sectionKey: string,
  html: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const catalog = SECTION_CATALOG.find((s) => s.key === sectionKey);
  if (!catalog) {
    return { ok: false, error: "Unknown section" };
  }

  const sanitized = sanitizeProposalHtml(html);
  const existing = await db
    .select({ id: proposalSections.id })
    .from(proposalSections)
    .where(
      and(
        eq(proposalSections.proposalId, proposalId),
        eq(proposalSections.key, sectionKey),
      ),
    )
    .limit(1);

  if (!existing[0]) {
    return { ok: false, error: "Section not found — generate the proposal first" };
  }

  await db
    .update(proposalSections)
    .set({
      htmlContent: sanitized,
      humanEdited: true,
      updatedAt: new Date(),
    })
    .where(eq(proposalSections.id, existing[0].id));

  await db
    .update(proposals)
    .set({ updatedAt: new Date() })
    .where(eq(proposals.id, proposalId));

  await db.insert(proposalEvents).values({
    proposalId,
    type: "section_saved",
    message: `Saved section “${catalog.title}”.`,
    meta: { sectionKey },
  });

  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath(`/proposals/${proposalId}/edit`);
  revalidatePath(`/proposals/${proposalId}/preview`);
  return { ok: true };
}

export async function saveSectionTitle(
  proposalId: string,
  sectionKey: string,
  title: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const catalog = SECTION_CATALOG.find((s) => s.key === sectionKey);
  if (!catalog) {
    return { ok: false, error: "Unknown section" };
  }

  const trimmed = title.trim();
  if (!trimmed) {
    return { ok: false, error: "Title can't be empty" };
  }

  const existing = await db
    .select({ id: proposalSections.id })
    .from(proposalSections)
    .where(
      and(
        eq(proposalSections.proposalId, proposalId),
        eq(proposalSections.key, sectionKey),
      ),
    )
    .limit(1);

  if (!existing[0]) {
    return { ok: false, error: "Section not found — generate the proposal first" };
  }

  await db
    .update(proposalSections)
    .set({ title: trimmed, humanEdited: true, updatedAt: new Date() })
    .where(eq(proposalSections.id, existing[0].id));

  await db
    .update(proposals)
    .set({ updatedAt: new Date() })
    .where(eq(proposals.id, proposalId));

  await db.insert(proposalEvents).values({
    proposalId,
    type: "section_saved",
    message: `Renamed section to “${trimmed}”.`,
    meta: { sectionKey, field: "title" },
  });

  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath(`/proposals/${proposalId}/edit`);
  revalidatePath(`/proposals/${proposalId}/preview`);
  return { ok: true };
}

export type RegenerateAffectedResult =
  | { ok: true; regenerated: SectionKey[] }
  | { ok: false; error: string };

/**
 * Re-validates staleness fresh (never trusts a client-side list) and
 * regenerates each affected, non-human-edited section sequentially so later
 * sections in the batch see earlier ones' fresh content.
 */
export async function regenerateAffectedSections(
  proposalId: string,
): Promise<RegenerateAffectedResult> {
  const proposal = await getProposal(proposalId);
  if (!proposal) {
    return { ok: false, error: "Proposal not found" };
  }

  const sections = await listSections(proposalId);
  const { toRegenerate } = getStaleSections(proposal, sections);

  if (toRegenerate.length === 0) {
    return { ok: true, regenerated: [] };
  }

  await db
    .update(proposals)
    .set({ status: "generating", updatedAt: new Date() })
    .where(eq(proposals.id, proposalId));

  try {
    const intake = proposalToIntake(proposal);
    let currentSections = sections.map((s) => ({
      key: s.key,
      title: s.title,
      content: s.htmlContent,
    }));

    for (const key of toRegenerate) {
      const result = await regenerateSection(intake, currentSections, key);
      await upsertSections(proposalId, [result]);

      currentSections = currentSections.map((s) =>
        s.key === key
          ? { key: result.key, title: result.title, content: result.content }
          : s,
      );

      await db.insert(proposalEvents).values({
        proposalId,
        type: "section_regenerated",
        message: `Regenerated section "${result.title}" from intake changes.`,
        meta: { sectionKey: key, reason: "intake_update" },
      });
    }

    await db
      .update(proposals)
      .set({
        status: "in_review",
        lastGeneratedIntakeSnapshot: intake,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));

    revalidatePath("/");
    revalidatePath(`/proposals/${proposalId}`);
    revalidatePath(`/proposals/${proposalId}/edit`);
    revalidatePath(`/proposals/${proposalId}/preview`);

    return { ok: true, regenerated: toRegenerate };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Regeneration failed";

    await db
      .update(proposals)
      .set({ status: "in_review", updatedAt: new Date() })
      .where(eq(proposals.id, proposalId));

    await db.insert(proposalEvents).values({
      proposalId,
      type: "failed",
      message: `Regenerate sections failed: ${message}`,
      meta: { step: "regenerate", attempted: toRegenerate },
    });

    revalidatePath(`/proposals/${proposalId}`);
    return { ok: false, error: message };
  }
}
