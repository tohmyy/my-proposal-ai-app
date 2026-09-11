import Link from "next/link";
import { notFound } from "next/navigation";
import { getProposal } from "@/lib/proposals/actions";
import { listSections } from "@/lib/proposals/generate-actions";
import { STATUS_LABELS } from "@/lib/proposals/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { SectionEditor } from "@/components/section-editor";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditProposalPage({
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
          </div>
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight">
            Edit sections
          </h1>
          <p className="text-[var(--koya-muted)]">
            {proposal.title || "Untitled proposal"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/proposals/${id}/preview`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Full preview
          </Link>
          <Link
            href={`/proposals/${id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to hub
          </Link>
        </div>
      </header>

      <SectionEditor
        proposalId={id}
        sections={sections.map((s) => ({
          id: s.id,
          key: s.key,
          title: s.title,
          htmlContent: s.htmlContent,
        }))}
      />
    </div>
  );
}
