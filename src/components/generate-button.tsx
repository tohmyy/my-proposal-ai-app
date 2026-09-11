"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { generateProposal } from "@/lib/proposals/generate-actions";

export function GenerateButton({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function onGenerate() {
    startTransition(async () => {
      const result = await generateProposal(proposalId);
      if (!result.ok) {
        toast.error(result.error);
        router.refresh();
        return;
      }
      router.refresh();
      if (result.status === "in_review" || result.sectionCount > 0) {
        router.push(`/proposals/${proposalId}/preview`);
      }
    });
  }

  return (
    <Button type="button" onClick={onGenerate} disabled={pending} size="lg">
      {pending ? "Generating…" : "Generate with AI"}
    </Button>
  );
}
