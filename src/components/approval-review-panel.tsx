"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { approveProposal, rejectProposal } from "@/lib/proposals/actions";

export function ApprovalReviewPanel({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveProposal(proposalId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onConfirmReject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectProposal(proposalId, reason);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRejecting(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="no-print rounded-lg border border-sky-300/80 bg-sky-50/90 px-4 py-4 text-sm text-sky-950">
      <p className="font-semibold">Pending approval</p>
      <p className="mt-1 text-sky-900/80">
        Review the proposal above, then approve it or send it back for changes.
      </p>

      {!rejecting ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="button" onClick={onApprove} disabled={pending}>
            {pending ? "Approving…" : "Approve"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRejecting(true)}
            disabled={pending}
          >
            Reject
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional: why is this being sent back? (visible on the hub)"
            rows={3}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={onConfirmReject} disabled={pending}>
              {pending ? "Sending back…" : "Send back for changes"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setRejecting(false);
                setReason("");
                setError(null);
              }}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
