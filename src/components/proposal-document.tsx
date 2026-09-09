import type { Proposal, ProposalSection } from "@/db/schema";

function formatCallDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ProposalDocument({
  proposal,
  sections,
}: {
  proposal: Proposal;
  sections: ProposalSection[];
}) {
  const clientLabel =
    proposal.companyName?.trim() ||
    proposal.clientName?.trim() ||
    "your organization";
  const dateLabel = formatCallDate(proposal.dateOfCall);

  return (
    <article className="proposal-document mx-auto w-full max-w-3xl rounded-sm border border-[var(--koya-line)] bg-white px-8 py-10 shadow-[0_18px_50px_-28px_rgba(12,18,34,0.35)] sm:px-12 sm:py-14">
      <header className="border-b border-[var(--koya-line)] pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--koya-accent)]">
          Koya Talent
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-source-serif)] text-3xl font-semibold tracking-tight text-[var(--koya-ink)] sm:text-4xl">
          Proposal for {clientLabel}
        </h1>
        <div className="mt-4 space-y-1 font-[family-name:var(--font-source-serif)] text-base text-[var(--koya-ink-soft)]">
          {proposal.salespersonName?.trim() && (
            <p>Prepared by {proposal.salespersonName.trim()}</p>
          )}
          {dateLabel && <p>Date: {dateLabel}</p>}
          {proposal.clientName?.trim() && proposal.companyName?.trim() && (
            <p>
              Prepared for {proposal.clientName.trim()}
              {proposal.companyName.trim()
                ? `, ${proposal.companyName.trim()}`
                : ""}
            </p>
          )}
        </div>
      </header>

      <div className="divide-y divide-[var(--koya-line)]/80">
        {sections.map((section, index) => (
          <section key={section.id} className="py-8">
            <h2 className="font-[family-name:var(--font-source-serif)] text-xl font-semibold text-[var(--koya-ink)] sm:text-2xl">
              {index + 1}. {section.title}
            </h2>
            <div
              className="prose-koya mt-4"
              dangerouslySetInnerHTML={{ __html: section.htmlContent }}
            />
          </section>
        ))}
      </div>

      <footer className="mt-4 border-t border-[var(--koya-line)] pt-8 font-[family-name:var(--font-source-serif)] text-base text-[var(--koya-ink-soft)]">
        <p>Looking forward to working together.</p>
        {proposal.salespersonName?.trim() && (
          <p className="mt-4">
            Warm regards,
            <br />
            {proposal.salespersonName.trim()}
            <br />
            Koya Talent
          </p>
        )}
      </footer>
    </article>
  );
}
