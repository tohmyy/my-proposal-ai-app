"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { requestApproval } from "@/lib/proposals/actions";

export function RequestApprovalButton({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onRequest() {
    setError(null);
    startTransition(async () => {
      const result = await requestApproval(proposalId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" onClick={onRequest} disabled={pending}>
        {pending ? "Requesting…" : "Request approval"}
      </Button>
      {error && <p className="text-sm text-rose-700">{error}</p>}
    </div>
  );
}
