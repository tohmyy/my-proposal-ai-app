"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  proposalEvents,
  proposalSectionRevisions,
  proposalSections,
  type SectionRevisionSource,
} from "@/db/schema";
import {
  sectionRelevantSnapshot,
  type SectionKey,
} from "@/lib/proposals/intake-section-map";
import type { IntakeInput } from "@/lib/proposals/types";

/** Sources whose content is a deterministic function of intake — safe to
 * serve back from the cache. Manual rewords and human edits are excluded
 * on purpose (see the plan's design decisions). */
const CACHE_ELIGIBLE_SOURCES: SectionRevisionSource[] = [
  "initial_generate",
  "selective_regen",
];

/** Appends one entry to a section's history — never mutates prior rows. */
export async function recordSectionRevision(
  proposalId: string,
  section: { key: string; title: string; htmlContent: string },
  source: SectionRevisionSource,
  intake: IntakeInput | null,
): Promise<void> {
  const humanEdited = source === "human_edit";
  const fieldsSnapshot =
    intake && !humanEdited
      ? sectionRelevantSnapshot(intake, section.key as SectionKey)
      : {};

  await db.insert(proposalSectionRevisions).values({
    proposalId,
    sectionKey: section.key,
    title: section.title,
    htmlContent: section.htmlContent,
    fieldsSnapshot,
    source,
    humanEdited,
  });
}

/**
 * Looks for a past AI-authored revision of this section whose driving
 * intake fields exactly match the current ones — if found, its content can
 * be reused instead of calling Claude again.
 */
export async function findCachedSectionRevision(
  proposalId: string,
  sectionKey: SectionKey,
  intake: IntakeInput,
): Promise<{ title: string; htmlContent: string } | null> {
  const snapshot = sectionRelevantSnapshot(intake, sectionKey);

  const rows = await db
    .select({
      title: proposalSectionRevisions.title,
      htmlContent: proposalSectionRevisions.htmlContent,
    })
    .from(proposalSectionRevisions)
    .where(
      and(
        eq(proposalSectionRevisions.proposalId, proposalId),
        eq(proposalSectionRevisions.sectionKey, sectionKey),
        inArray(proposalSectionRevisions.source, CACHE_ELIGIBLE_SOURCES),
        eq(proposalSectionRevisions.fieldsSnapshot, snapshot),
      ),
    )
    .orderBy(desc(proposalSectionRevisions.createdAt))
    .limit(1);

  return rows[0] ?? null;
}

/** Full history for a section, most recent first — for the version history UI. */
export async function listSectionRevisions(proposalId: string, sectionKey: string) {
  return db
    .select()
    .from(proposalSectionRevisions)
    .where(
      and(
        eq(proposalSectionRevisions.proposalId, proposalId),
        eq(proposalSectionRevisions.sectionKey, sectionKey),
      ),
    )
    .orderBy(desc(proposalSectionRevisions.createdAt));
}

/**
 * Makes a past revision the live content again. This is itself recorded as
 * a new `restored` revision (never a destructive rewind), and carries over
 * that revision's `humanEdited` flag so the section is correctly
 * re-protected (or re-exposed to future auto-regen) afterward.
 */
export async function restoreSectionRevision(
  proposalId: string,
  revisionId: string,
): Promise<
  | { ok: true; title: string; htmlContent: string }
  | { ok: false; error: string }
> {
  const [revision] = await db
    .select()
    .from(proposalSectionRevisions)
    .where(
      and(
        eq(proposalSectionRevisions.id, revisionId),
        eq(proposalSectionRevisions.proposalId, proposalId),
      ),
    )
    .limit(1);

  if (!revision) {
    return { ok: false, error: "Revision not found" };
  }

  const [existing] = await db
    .select({ id: proposalSections.id })
    .from(proposalSections)
    .where(
      and(
        eq(proposalSections.proposalId, proposalId),
        eq(proposalSections.key, revision.sectionKey),
      ),
    )
    .limit(1);

  if (!existing) {
    return { ok: false, error: "Section not found" };
  }

  await db
    .update(proposalSections)
    .set({
      title: revision.title,
      htmlContent: revision.htmlContent,
      humanEdited: revision.humanEdited,
      updatedAt: new Date(),
    })
    .where(eq(proposalSections.id, existing.id));

  await db.insert(proposalSectionRevisions).values({
    proposalId,
    sectionKey: revision.sectionKey,
    title: revision.title,
    htmlContent: revision.htmlContent,
    fieldsSnapshot: revision.fieldsSnapshot,
    source: "restored",
    humanEdited: revision.humanEdited,
    restoredFromRevisionId: revision.id,
  });

  await db.insert(proposalEvents).values({
    proposalId,
    type: "section_restored",
    message: `Restored an earlier version of section "${revision.title}".`,
    meta: { sectionKey: revision.sectionKey, revisionId },
  });

  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath(`/proposals/${proposalId}/edit`);
  revalidatePath(`/proposals/${proposalId}/preview`);

  return { ok: true, title: revision.title, htmlContent: revision.htmlContent };
}
