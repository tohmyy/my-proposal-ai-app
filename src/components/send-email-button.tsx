"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendProposalEmail } from "@/lib/proposals/actions";

export function SendEmailButton({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSend() {
    setError(null);
    startTransition(async () => {
      const result = await sendProposalEmail(proposalId);
      if (!result.ok) {
        setError(result.error);
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" onClick={onSend} disabled={pending}>
        {pending ? "Sending…" : "Send to client"}
      </Button>
      {error && <p className="max-w-xs text-right text-sm text-rose-700">{error}</p>}
    </div>
  );
}
