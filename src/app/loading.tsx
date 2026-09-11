import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomeLoading() {
  return (
    <div className="space-y-10">
      <section className="animate-in-up max-w-2xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--koya-accent)]">
          Koya Talent
        </p>
        <h1 className="font-[family-name:var(--font-syne)] text-4xl font-bold tracking-tight text-[var(--koya-ink)] sm:text-5xl">
          Proposals that stay human-controlled.
        </h1>
        <p className="text-lg text-[var(--koya-muted)] leading-relaxed">
          Capture discovery intake, generate with Claude, review section by
          section, then approve before anything reaches the client.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/proposals/new" className={cn(buttonVariants({ size: "lg" }))}>
            <Plus className="h-4 w-4" />
            New proposal
          </Link>
        </div>
      </section>

      <section className="animate-in-up space-y-4" style={{ animationDelay: "80ms" }}>
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-semibold text-[var(--koya-ink)]">
            Recent proposals
          </h2>
          <div className="h-4 w-16 animate-pulse rounded bg-black/5" />
        </div>

        <ul className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--koya-line)] bg-white/70 px-5 py-4"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-2/5 animate-pulse rounded bg-black/5" />
                <div className="h-3 w-3/5 animate-pulse rounded bg-black/5" />
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="h-6 w-20 animate-pulse rounded-full bg-black/5" />
                <div className="h-4 w-4 animate-pulse rounded bg-black/5" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
