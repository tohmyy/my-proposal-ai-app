import Link from "next/link";
import { notFound } from "next/navigation";
import { getProposal } from "@/lib/proposals/actions";
import { getCurrentUser } from "@/lib/auth";
import { listSections } from "@/lib/proposals/generate-actions";
import { getSettings } from "@/lib/settings/actions";
import { STATUS_LABELS } from "@/lib/proposals/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProposalDocument } from "@/components/proposal-document";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { RequestApprovalButton } from "@/components/request-approval-button";
import { ApprovalReviewPanel } from "@/components/approval-review-panel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProposalPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;
  const isPrintCapture = print === "1";
  const proposal = await getProposal(id);
  if (!proposal) notFound();

  const [sections, settings, user] = await Promise.all([
    listSections(id),
    getSettings(),
    getCurrentUser(),
  ]);

  // Public client link + Chromium print capture: document only (plus a
  // no-print download strip for real clients — hidden during ?print=1).
  const publicDocumentOnly = !user || isPrintCapture;

  if (publicDocumentOnly) {
    if (sections.length === 0) {
      return (
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <p className="font-[family-name:var(--font-syne)] text-xl font-semibold text-[var(--koya-ink)]">
            Proposal not available
          </p>
          <p className="mt-2 text-sm text-[var(--koya-muted)]">
            This proposal has no content to display yet.
          </p>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {!isPrintCapture && (
          <div className="no-print mb-6 flex flex-wrap items-center justify-end gap-2">
            {proposal.pdfUrl ? (
              <a
                href={proposal.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants())}
                download
              >
                Download PDF
              </a>
            ) : null}
            <ExportPdfButton proposalId={id} title={proposal.title} />
          </div>
        )}
        <ProposalDocument
          proposal={proposal}
          sections={sections}
          settings={settings}
          editable={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in-up">
      <header className="no-print flex flex-col gap-4 border-b border-[var(--koya-line)] pb-6 sm:flex-row sm:items-start sm:justify-between">
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
            Read the full draft as the client would see it. Use the hub or
            section editor for structural changes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/proposals/${id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to hub
          </Link>
          {sections.length > 0 && (
            <>
              <ExportPdfButton proposalId={id} title={proposal.title} />
              <Link
                href={`/proposals/${id}/edit`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Edit sections
              </Link>
              {proposal.status === "in_review" && (
                <RequestApprovalButton proposalId={id} />
              )}
            </>
          )}
        </div>
      </header>

      {proposal.status === "pending_approval" && (
        <ApprovalReviewPanel
          proposalId={id}
          canApprove={user.role === "approver"}
        />
      )}

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
        <ProposalDocument
          proposal={proposal}
          sections={sections}
          settings={settings}
          editable
        />
      )}
    </div>
  );
}
