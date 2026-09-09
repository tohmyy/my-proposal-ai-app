import Link from "next/link";
import { notFound } from "next/navigation";
import { getProposal } from "@/lib/proposals/actions";
import { listSections } from "@/lib/proposals/generate-actions";
import { STATUS_LABELS } from "@/lib/proposals/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProposalDocument } from "@/components/proposal-document";

export const dynamic = "force-dynamic";

export default async function ProposalPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) notFound();

  const sections = await listSections(id);

  return (
    <div className="space-y-8 animate-in-up">
      <header className="flex flex-col gap-4 border-b border-[var(--koya-line)] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge
              status={proposal.status}
              label={STATUS_LABELS[proposal.status] ?? proposal.status}
            />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--koya-muted)]">
              Full preview
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight">
            Review proposal
          </h1>
          <p className="max-w-xl text-[var(--koya-muted)]">
            Read the full draft as the client would see it. When you are ready,
            open the section editor to revise specific parts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/proposals/${id}`}
            className="inline-flex h-11 items-center rounded-md border border-[var(--koya-line)] bg-white/70 px-4 text-sm font-semibold transition hover:border-[var(--koya-ink)]"
          >
            Back to hub
          </Link>
          {sections.length > 0 && (
            <Link
              href={`/proposals/${id}/edit`}
              className="inline-flex h-11 items-center rounded-md bg-[var(--koya-accent)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--koya-accent-hover)] hover:-translate-y-px"
            >
              Edit sections
            </Link>
          )}
        </div>
      </header>

      {sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--koya-line)] bg-white/50 px-6 py-16 text-center">
          <p className="font-[family-name:var(--font-syne)] text-xl font-semibold">
            No proposal content yet
          </p>
          <p className="mt-2 text-sm text-[var(--koya-muted)]">
            Generate the proposal from the hub first, then return here to review
            it as a whole.
          </p>
          <Link
            href={`/proposals/${id}`}
            className="mt-6 inline-flex text-sm font-semibold text-[var(--koya-accent)] hover:underline"
          >
            Go to hub
          </Link>
        </div>
      ) : (
        <ProposalDocument proposal={proposal} sections={sections} />
      )}
    </div>
  );
}
