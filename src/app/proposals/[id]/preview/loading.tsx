export default function ProposalPreviewLoading() {
  return (
    <div className="space-y-8 animate-in-up">
      <header className="flex flex-col gap-4 border-b border-[var(--koya-line)] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-6 w-24 animate-pulse rounded-full bg-black/5" />
            <div className="h-3 w-24 animate-pulse rounded bg-black/5" />
          </div>
          <div className="h-8 w-56 animate-pulse rounded bg-black/5" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-11 w-32 animate-pulse rounded-md bg-black/5" />
          ))}
        </div>
      </header>

      <div className="space-y-8 rounded-xl border border-[var(--koya-line)] bg-white/80 p-10 shadow-sm">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-5 w-1/3 animate-pulse rounded bg-black/5" />
            <div className="h-3 w-full animate-pulse rounded bg-black/5" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-black/5" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-black/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
