import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16 text-center animate-in-up">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold">
        Proposal not found
      </h1>
      <p className="text-[var(--koya-muted)]">
        That draft may have been removed, or the link is incorrect.
      </p>
      <Link
        href="/"
        className="inline-flex h-11 items-center rounded-md bg-[var(--koya-accent)] px-5 text-sm font-semibold text-white"
      >
        Back to proposals
      </Link>
    </div>
  );
}
