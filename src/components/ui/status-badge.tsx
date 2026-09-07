import { cn } from "@/lib/utils";

const toneStyles = {
  draft: "bg-slate-200/80 text-slate-800",
  generating: "bg-amber-100 text-amber-900",
  needs_clarification: "bg-orange-100 text-orange-900",
  in_review: "bg-teal-100 text-teal-900",
  pending_approval: "bg-sky-100 text-sky-900",
  approved: "bg-emerald-100 text-emerald-900",
  sent: "bg-indigo-100 text-indigo-900",
  failed: "bg-rose-100 text-rose-900",
} as const;

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label: string;
  className?: string;
}) {
  const tone =
    toneStyles[status as keyof typeof toneStyles] ?? toneStyles.draft;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide animate-in-fade",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}
