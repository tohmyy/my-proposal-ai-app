import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="koya-grain pointer-events-none absolute inset-0" aria-hidden />
      <header className="no-print relative z-10 border-b border-[var(--koya-line)]/80 bg-[var(--koya-mist)]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="group flex items-baseline gap-3">
            <span className="font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight text-[var(--koya-ink)]">
              Koya Talent
            </span>
            <span className="hidden text-xs font-medium uppercase tracking-[0.18em] text-[var(--koya-muted)] sm:inline">
              Proposals
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-md px-3 py-2 text-sm font-medium text-[var(--koya-ink-soft)] transition hover:bg-black/5 hover:text-[var(--koya-ink)]"
            >
              All proposals
            </Link>
            <Link
              href="/settings"
              className="rounded-md px-3 py-2 text-sm font-medium text-[var(--koya-ink-soft)] transition hover:bg-black/5 hover:text-[var(--koya-ink)]"
            >
              Settings
            </Link>
            <Link
              href="/proposals/new"
              className="rounded-md bg-[var(--koya-accent)] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--koya-accent-hover)] hover:-translate-y-px"
            >
              New proposal
            </Link>
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}
