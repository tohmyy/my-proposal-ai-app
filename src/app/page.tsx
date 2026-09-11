import Link from "next/link";
import { ArrowRight, FileText, Plus } from "lucide-react";
import { listProposals } from "@/lib/proposals/actions";
import { STATUS_LABELS } from "@/lib/proposals/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let items: Awaited<ReturnType<typeof listProposals>> = [];
  let dbError: string | null = null;

  try {
    items = await listProposals();
  } catch (err) {
    dbError =
      err instanceof Error
        ? err.message
        : "Could not load proposals. Check DATABASE_URL.";
  }

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
          <Link
            href="/proposals/new"
            className={cn(buttonVariants({ size: "lg" }))}
          >
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
          <span className="text-sm text-[var(--koya-muted)]">
            {items.length} total
          </span>
        </div>

        {dbError && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">Database not connected</p>
            <p className="mt-1">
              Copy <code className="rounded bg-white/80 px-1">.env.example</code>{" "}
              to <code className="rounded bg-white/80 px-1">.env.local</code>, set{" "}
              <code className="rounded bg-white/80 px-1">DATABASE_URL</code>, then
              run <code className="rounded bg-white/80 px-1">npm run db:push</code>.
            </p>
            <p className="mt-2 text-amber-900/80">{dbError}</p>
          </div>
        )}

        {!dbError && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--koya-line)] bg-white/50 px-8 py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-[var(--koya-muted)]" />
            <h3 className="mt-4 font-[family-name:var(--font-syne)] text-xl font-semibold">
              No proposals yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--koya-muted)]">
              Start with intake from a discovery call. Generation and review come
              next.
            </p>
            <Link
              href="/proposals/new"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--koya-accent)] hover:underline"
            >
              Create your first draft
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        <ul className="space-y-3">
          {items.map((p) => (
            <li key={p.id}>
              <Link
                href={`/proposals/${p.id}`}
                className="proposal-row flex items-center justify-between gap-4 rounded-xl border border-[var(--koya-line)] bg-white/70 px-5 py-4"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-semibold text-[var(--koya-ink)]">
                    {p.title || "Untitled proposal"}
                  </p>
                  <p className="truncate text-sm text-[var(--koya-muted)]">
                    {[p.companyName, p.clientName, p.salespersonName]
                      .filter(Boolean)
                      .join(" · ") || "No client details yet"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge
                    status={p.status}
                    label={STATUS_LABELS[p.status] ?? p.status}
                  />
                  <ArrowRight className="h-4 w-4 text-[var(--koya-muted)]" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
