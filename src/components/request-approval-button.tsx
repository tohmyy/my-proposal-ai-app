"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { requestApproval } from "@/lib/proposals/actions";

export function RequestApprovalButton({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function onRequest() {
    startTransition(async () => {
      const result = await requestApproval(proposalId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button type="button" onClick={onRequest} disabled={pending}>
      {pending ? "Requesting…" : "Request approval"}
    </Button>
  );
}
