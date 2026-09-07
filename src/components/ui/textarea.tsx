import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[120px] w-full rounded-md border border-[var(--koya-line)] bg-white/80 px-3 py-2 text-sm text-[var(--koya-ink)] shadow-sm transition placeholder:text-[var(--koya-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--koya-accent)] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";
