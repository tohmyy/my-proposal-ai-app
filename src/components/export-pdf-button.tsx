"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { logProposalExport } from "@/lib/proposals/actions";

export function ExportPdfButton({
  proposalId,
  title,
}: {
  proposalId: string;
  title?: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function onExport() {
    const previousTitle = document.title;
    const exportTitle =
      title?.trim() || previousTitle || "Koya Talent Proposal";
    document.title = exportTitle;

    startTransition(async () => {
      await logProposalExport(proposalId);
    });

    // Let the title update apply before the print dialog opens.
    window.setTimeout(() => {
      window.print();
      document.title = previousTitle;
    }, 50);
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onExport}
      disabled={pending}
      className="no-print"
    >
      {pending ? "Exporting…" : "Export PDF"}
    </Button>
  );
}
