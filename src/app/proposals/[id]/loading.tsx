function LabelValueRow() {
  return (
    <div className="space-y-1.5">
      <div className="h-3 w-24 animate-pulse rounded bg-black/5" />
      <div className="h-4 w-full animate-pulse rounded bg-black/5" />
    </div>
  );
}

export default function ProposalHubLoading() {
  return (
    <div className="space-y-10 animate-in-up">
      <header className="flex flex-col gap-4 border-b border-[var(--koya-line)] pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-6 w-24 animate-pulse rounded-full bg-black/5" />
            <div className="h-3 w-32 animate-pulse rounded bg-black/5" />
          </div>
          <div className="h-9 w-72 animate-pulse rounded bg-black/5" />
          <div className="h-4 w-48 animate-pulse rounded bg-black/5" />
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-11 w-28 animate-pulse rounded-md bg-black/5" />
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="space-y-5 rounded-xl border border-[var(--koya-line)] bg-white/70 p-6"
          >
            <div className="h-5 w-36 animate-pulse rounded bg-black/5" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <LabelValueRow key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
