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
import { RegenerateSectionsButton } from "@/components/regenerate-sections-button";
import { cn } from "@/lib/utils";
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
      <header className="animate-in-up space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--koya-accent)]">
          Intake
        </p>
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight sm:text-4xl">
          Edit intake
        </h1>
        <p className="text-[var(--koya-muted)]">
          {proposal.title || "Untitled proposal"}
        </p>
      </header>

      {(toRegenerate.length > 0 || skippedHumanEdited.length > 0) && (
        <div className="rounded-lg border border-[var(--koya-accent)]/40 bg-teal-50/70 px-4 py-3 text-sm text-[var(--koya-ink)]">
          {toRegenerate.length > 0 && (
            <>
              <p className="font-semibold">
                Intake changes affect {toRegenerate.length} section
                {toRegenerate.length > 1 ? "s" : ""}
              </p>
              <p className="mt-1 text-[var(--koya-ink-soft)]">
                {toRegenerate.map(sectionTitle).join(", ")}
              </p>
            </>
          )}
          {skippedHumanEdited.length > 0 && (
            <p className={cn(toRegenerate.length > 0 ? "mt-1" : "", "text-[var(--koya-muted)]")}>
              Skipping {skippedHumanEdited.length} section
              {skippedHumanEdited.length > 1 ? "s" : ""} you&rsquo;ve edited
              manually: {skippedHumanEdited.map(sectionTitle).join(", ")}
              {toRegenerate.length === 0 &&
                " — edit it yourself if it needs to reflect the change."}
            </p>
          )}
          {toRegenerate.length > 0 && (
            <div className="mt-3">
              <RegenerateSectionsButton proposalId={id} />
            </div>
          )}
        </div>
      )}

      <IntakeForm
        action={save}
        initial={proposal}
        clarificationGaps={clarificationGaps}
        clarifyingQuestions={clarifyingQuestions}
        submitLabel="Save intake"
      />
    </div>
  );
}
