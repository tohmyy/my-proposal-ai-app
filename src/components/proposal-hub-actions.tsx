"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap items-center justify-end gap-2">
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
          <>
            <Link
              href={`/proposals/${proposalId}/preview`}
              className={cn(buttonVariants())}
            >
              Preview proposal
            </Link>
            <Link
              href={`/proposals/${proposalId}/intake`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Edit intake
            </Link>
          </>
        ) : (
          <Link
            href={`/proposals/${proposalId}/intake`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Edit intake
          </Link>
        )}

        {canSend && <SendEmailButton proposalId={proposalId} />}

        {(hasSections || pdfUrl) && (
          <MoreActionsMenu
            proposalId={proposalId}
            hasSections={hasSections}
            pdfUrl={pdfUrl}
            hideEditIntake={needsClarification || canGenerate || hasSections}
            hidePreview={!canGenerate && hasSections}
          />
        )}
      </div>
    </div>
  );
}

function MoreActionsMenu({
  proposalId,
  hasSections,
  pdfUrl,
  hideEditIntake,
  hidePreview,
}: {
  proposalId: string;
  hasSections: boolean;
  pdfUrl: string | null;
  hideEditIntake: boolean;
  hidePreview: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const showEditIntakeItem = !hideEditIntake;
  const showPreviewItem = hasSections && !hidePreview;
  const hasAnyItem =
    showEditIntakeItem || showPreviewItem || hasSections || Boolean(pdfUrl);
  if (!hasAnyItem) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        More
        <ChevronDown
          className={cn("h-4 w-4 transition", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-20 mt-2 min-w-[13rem] rounded-lg border border-[var(--koya-line)] bg-white py-1 shadow-[0_12px_32px_-16px_rgba(12,18,34,0.45)]"
        >
          {showEditIntakeItem && (
            <MenuLink
              href={`/proposals/${proposalId}/intake`}
              onNavigate={() => setOpen(false)}
            >
              Edit intake
            </MenuLink>
          )}
          {showPreviewItem && (
            <MenuLink
              href={`/proposals/${proposalId}/preview`}
              onNavigate={() => setOpen(false)}
            >
              Preview proposal
            </MenuLink>
          )}
          {hasSections && (
            <>
              <MenuLink
                href={`/proposals/${proposalId}/edit`}
                onNavigate={() => setOpen(false)}
              >
                Edit sections
              </MenuLink>
              <div className="my-1 border-t border-[var(--koya-line)]" />
              <div className="px-1 py-1">
                <GeneratePdfButton proposalId={proposalId} menuItem />
              </div>
            </>
          )}
          {pdfUrl && (
            <a
              role="menuitem"
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 text-sm font-medium text-[var(--koya-ink)] hover:bg-[var(--koya-mist)]"
              onClick={() => setOpen(false)}
            >
              Download PDF
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      className="block px-3 py-2 text-sm font-medium text-[var(--koya-ink)] hover:bg-[var(--koya-mist)]"
      onClick={onNavigate}
    >
      {children}
    </Link>
  );
}
