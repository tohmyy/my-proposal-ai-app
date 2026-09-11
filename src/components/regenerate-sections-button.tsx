"use client";

import { Button } from "@/components/ui/button";

export function RegenerateSectionsButton({
  pending,
  disabled,
  disabledReason,
  error,
  onClick,
}: {
  pending: boolean;
  disabled?: boolean;
  disabledReason?: string;
  error?: string | null;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        onClick={onClick}
        disabled={pending || disabled}
        size="sm"
      >
        {pending ? "Regenerating…" : "Regenerate these sections"}
      </Button>
      {error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : (
        disabledReason && (
          <p className="text-sm text-[var(--koya-muted)]">{disabledReason}</p>
        )
      )}
    </div>
  );
}
