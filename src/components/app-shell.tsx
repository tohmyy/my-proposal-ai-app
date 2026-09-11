import Link from "next/link";
import { ToastProvider } from "@/components/ui/toast";
import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentUser } from "@/lib/auth";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

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
            {user ? (
              <>
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
                <span className="mx-1 h-6 w-px bg-[var(--koya-line)]" aria-hidden />
                <span className="flex items-center gap-2 text-sm text-[var(--koya-ink-soft)]">
                  {user.email}
                  <span className="rounded-full bg-[var(--koya-mist)] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--koya-muted)]">
                    {user.role}
                  </span>
                </span>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="rounded-md px-3 py-2 text-sm font-medium text-[var(--koya-ink-soft)] transition hover:bg-black/5 hover:text-[var(--koya-ink)]"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-md bg-[var(--koya-accent)] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--koya-accent-hover)] hover:-translate-y-px"
                >
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <ToastProvider>{children}</ToastProvider>
      </main>
    </div>
  );
}
