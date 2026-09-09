import { notFound } from "next/navigation";
import {
  getProposal,
  listProposalEvents,
  updateProposalIntake,
} from "@/lib/proposals/actions";
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

  const events = await listProposalEvents(id);
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
