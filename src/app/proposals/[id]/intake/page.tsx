import { notFound } from "next/navigation";
import {
  getProposal,
  updateProposalIntake,
} from "@/lib/proposals/actions";
import { IntakeForm } from "@/components/intake-form";

export const dynamic = "force-dynamic";

export default async function EditIntakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) notFound();

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
        submitLabel="Save intake"
      />
    </div>
  );
}
