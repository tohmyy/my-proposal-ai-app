import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProposal,
  listProposalEvents,
  updateProposalIntake,
} from "@/lib/proposals/actions";
import { listSections } from "@/lib/proposals/generate-actions";
import { getStaleSections } from "@/lib/proposals/intake-section-map";
import { SECTION_CATALOG } from "@/lib/ai/prompts";
import { IntakeForm } from "@/components/intake-form";
import type { ClarificationGap } from "@/lib/proposals/types";

export const dynamic = "force-dynamic";

export default async function EditIntakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) notFound();

  const [events, sections] = await Promise.all([
    listProposalEvents(id),
    listSections(id),
  ]);
  const clarificationEvent =
    proposal.status === "needs_clarification"
      ? events.find((e) => e.type === "clarification_needed")
      : null;

  const meta = clarificationEvent?.meta as
    | {
        gaps?: ClarificationGap[];
        clarifyingQuestions?: string[];
      }
    | null
    | undefined;

  const clarificationGaps = meta?.gaps ?? [];
  const clarifyingQuestions = meta?.clarifyingQuestions ?? [];

  const { toRegenerate, skippedHumanEdited } = getStaleSections(proposal, sections);
  const sectionTitle = (key: string) =>
    SECTION_CATALOG.find((s) => s.key === key)?.title ?? key;

  async function save(formData: FormData) {
    "use server";
    return updateProposalIntake(id, formData);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="animate-in-up flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--koya-accent)]">
            Intake
          </p>
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight sm:text-4xl">
            Edit intake
          </h1>
          <p className="text-[var(--koya-muted)]">
            {proposal.title || "Untitled proposal"}
          </p>
        </div>
        <Link
          href={`/proposals/${id}`}
          className="inline-flex h-11 items-center rounded-md border border-[var(--koya-line)] bg-white/70 px-4 text-sm font-semibold transition hover:border-[var(--koya-ink)]"
        >
          Back to hub
        </Link>
      </header>

      <IntakeForm
        action={save}
        initial={proposal}
        clarificationGaps={clarificationGaps}
        clarifyingQuestions={clarifyingQuestions}
        submitLabel="Save intake"
        templateLocked={sections.length > 0}
        proposalId={id}
        hasGeneratedSections={sections.length > 0}
        staleSectionTitles={toRegenerate.map(sectionTitle)}
        skippedSectionTitles={skippedHumanEdited.map(sectionTitle)}
        key={new Date(proposal.updatedAt).getTime()}
      />
    </div>
  );
}
