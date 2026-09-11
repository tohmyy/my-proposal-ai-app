"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuAnchor,
  DropdownMenuDivider,
  DropdownMenuLink,
} from "@/components/ui/dropdown-menu";
import { GenerateButton } from "@/components/generate-button";
import { GeneratePdfButton } from "@/components/generate-pdf-button";
import { SendEmailButton } from "@/components/send-email-button";
import { cn } from "@/lib/utils";
import type { ProposalStatus } from "@/db/schema";

type HubActionsProps = {
  proposalId: string;
  status: ProposalStatus;
  hasSections: boolean;
  pdfUrl: string | null;
};

/**
 * Hub header actions: one clear primary CTA + at most one secondary link,
 * with everything else under a single "More" menu so the header doesn't
 * wrap into a staggered button pile.
 */
export function ProposalHubActions({
  proposalId,
  status,
  hasSections,
  pdfUrl,
}: HubActionsProps) {
  const needsClarification = status === "needs_clarification";
  const canGenerate =
    status === "draft" || status === "needs_clarification";
  const canSend = status === "approved";

  const hideEditIntake = needsClarification || canGenerate;
  const hidePreview = !canGenerate && hasSections;
  const showMenu = hasSections || Boolean(pdfUrl);

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {canSend && <SendEmailButton proposalId={proposalId} />}

        {needsClarification ? (
          <>
            <Link
              href={`/proposals/${proposalId}/intake`}
              className={cn(buttonVariants())}
            >
              Edit intake
            </Link>
            {canGenerate && (
              <GenerateButton proposalId={proposalId} variant="outline" />
            )}
          </>
        ) : canGenerate ? (
          <>
            <GenerateButton proposalId={proposalId} />
            <Link
              href={`/proposals/${proposalId}/intake`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Edit intake
            </Link>
          </>
        ) : hasSections ? (
          <Link
            href={`/proposals/${proposalId}/preview`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Preview proposal
          </Link>
        ) : (
          <Link
            href={`/proposals/${proposalId}/intake`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Edit intake
          </Link>
        )}

        {showMenu && (
          <DropdownMenu label="More">
            {!hideEditIntake && (
              <DropdownMenuLink href={`/proposals/${proposalId}/intake`}>
                Edit intake
              </DropdownMenuLink>
            )}
            {hasSections && !hidePreview && (
              <DropdownMenuLink href={`/proposals/${proposalId}/preview`}>
                Preview proposal
              </DropdownMenuLink>
            )}
            {hasSections && (
              <>
                <DropdownMenuLink href={`/proposals/${proposalId}/edit`}>
                  Edit sections
                </DropdownMenuLink>
                <DropdownMenuDivider />
                <div className="px-1 py-1">
                  <GeneratePdfButton proposalId={proposalId} menuItem />
                </div>
              </>
            )}
            {pdfUrl && (
              <DropdownMenuAnchor href={pdfUrl} target="_blank" rel="noopener noreferrer">
                Download PDF
              </DropdownMenuAnchor>
            )}
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
