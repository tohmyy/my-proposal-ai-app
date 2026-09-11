"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TimelinePhase } from "@/db/schema";
import { cn } from "@/lib/utils";

const emptyPhase = (phase: number): TimelinePhase => ({
  phase,
  label: "",
  duration: "",
  deliveryWindow: "",
});

export function TimelinePhasesEditor({
  phases,
  onChange,
  errorNote,
  warnNote,
}: {
  phases: TimelinePhase[];
  onChange: (phases: TimelinePhase[]) => void;
  errorNote?: string;
  warnNote?: string;
}) {
  const rows = phases.length > 0 ? phases : [emptyPhase(1)];
  const note = errorNote || warnNote;
  const isWarn = !errorNote && Boolean(warnNote);

  function updateAt(index: number, patch: Partial<TimelinePhase>) {
    const next = rows.map((row, i) =>
      i === index ? { ...row, ...patch, phase: index + 1 } : { ...row, phase: i + 1 },
    );
    onChange(next);
  }

  function removeAt(index: number) {
    const next = rows
      .filter((_, i) => i !== index)
      .map((row, i) => ({ ...row, phase: i + 1 }));
    onChange(next.length ? next : [emptyPhase(1)]);
  }

  function addRow() {
    onChange([...rows, emptyPhase(rows.length + 1)]);
  }

  const serializable = rows
    .map((row, i) => ({
      phase: i + 1,
      label: row.label?.trim() ?? "",
      duration: row.duration?.trim() ?? "",
      deliveryWindow: row.deliveryWindow?.trim() ?? "",
    }))
    .filter((p) => p.label || p.duration || p.deliveryWindow);

  return (
    <div className="space-y-3">
      <div>
        <Label
          className={
            errorNote ? "text-rose-800" : isWarn ? "text-amber-900" : undefined
          }
        >
          Timeline phases
        </Label>
        <p className="mt-1 text-xs text-[var(--koya-muted)]">
          Optional. Use when the engagement has clear phases. Summary text above
          or at least one phase with duration/window satisfies the hard timeline
          check.
        </p>
      </div>
      <input
        type="hidden"
        name="timelinePhasesJson"
        value={JSON.stringify(serializable)}
      />
      <ul className="space-y-3">
        {rows.map((row, index) => (
          <li
            key={index}
            className={cn(
              "rounded-lg border bg-white/60 p-3",
              errorNote
                ? "border-rose-500 bg-rose-50/30"
                : isWarn
                  ? "border-amber-400 bg-amber-50/40"
                  : "border-[var(--koya-line)]",
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--koya-muted)]">
                Phase {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => removeAt(index)}
                aria-label={`Remove phase ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <Label
                  htmlFor={`phase-${index}-label`}
                  className="text-xs font-medium text-[var(--koya-muted)]"
                >
                  Label
                </Label>
                <Input
                  id={`phase-${index}-label`}
                  placeholder="e.g. Discovery"
                  value={row.label ?? ""}
                  onChange={(e) => updateAt(index, { label: e.target.value })}
                  className={cn(
                    errorNote &&
                      "border-rose-500 focus-visible:ring-rose-400 bg-rose-50/40",
                    isWarn &&
                      "border-amber-400 focus-visible:ring-amber-400 bg-amber-50/50",
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor={`phase-${index}-duration`}
                  className="text-xs font-medium text-[var(--koya-muted)]"
                >
                  Duration
                </Label>
                <Input
                  id={`phase-${index}-duration`}
                  placeholder="e.g. 4 days"
                  value={row.duration ?? ""}
                  onChange={(e) => updateAt(index, { duration: e.target.value })}
                  className={cn(
                    errorNote &&
                      "border-rose-500 focus-visible:ring-rose-400 bg-rose-50/40",
                    isWarn &&
                      "border-amber-400 focus-visible:ring-amber-400 bg-amber-50/50",
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor={`phase-${index}-deliveryWindow`}
                  className="text-xs font-medium text-[var(--koya-muted)]"
                >
                  Delivery window
                </Label>
                <Input
                  id={`phase-${index}-deliveryWindow`}
                  placeholder="e.g. 1 week"
                  value={row.deliveryWindow ?? ""}
                  onChange={(e) =>
                    updateAt(index, { deliveryWindow: e.target.value })
                  }
                  className={cn(
                    errorNote &&
                      "border-rose-500 focus-visible:ring-rose-400 bg-rose-50/40",
                    isWarn &&
                      "border-amber-400 focus-visible:ring-amber-400 bg-amber-50/50",
                  )}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      {note && (
        <p
          className={cn(
            "text-sm",
            errorNote ? "text-rose-700" : "text-amber-800",
          )}
        >
          {note}
        </p>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={addRow}>
        <Plus className="h-4 w-4" />
        Add phase
      </Button>
    </div>
  );
}
