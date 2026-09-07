import { createProposal } from "@/lib/proposals/actions";
import { IntakeForm } from "@/components/intake-form";

export default function NewProposalPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="animate-in-up space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--koya-accent)]">
          Intake
        </p>
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight sm:text-4xl">
          New proposal
        </h1>
        <p className="text-[var(--koya-muted)]">
          Capture the discovery call. Hard commercial fields are flagged if
          missing — you can still save a draft.
        </p>
      </header>
      <IntakeForm action={createProposal} submitLabel="Create draft" />
    </div>
  );
}
