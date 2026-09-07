import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProposal,
  listProposalEvents,
} from "@/lib/proposals/actions";
import {
  getMissingHardFields,
  HARD_FIELD_LABELS,
  proposalToIntake,
  STATUS_LABELS,
} from "@/lib/proposals/types";
import { StatusBadge } from "@/components/ui/status-badge";
import type { TimelinePhase } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function ProposalHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) notFound();

  const events = await listProposalEvents(id);
  const intake = proposalToIntake(proposal);
  const missing = getMissingHardFields(intake);

  return (
    <div className="space-y-10 animate-in-up">
      <header className="flex flex-col gap-4 border-b border-[var(--koya-line)] pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge
              status={proposal.status}
              label={STATUS_LABELS[proposal.status] ?? proposal.status}
            />
            <span className="text-xs text-[var(--koya-muted)]">
              Updated {proposal.updatedAt.toLocaleString()}
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight sm:text-4xl">
            {proposal.title || "Untitled proposal"}
          </h1>
          <p className="text-[var(--koya-muted)]">
            {[proposal.companyName, proposal.clientName]
              .filter(Boolean)
              .join(" · ") || "Client details incomplete"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/proposals/${id}/intake`}
            className="inline-flex h-11 items-center rounded-md border border-[var(--koya-line)] bg-white/70 px-4 text-sm font-semibold transition hover:border-[var(--koya-ink)]"
          >
            Edit intake
          </Link>
          <button
            type="button"
            disabled
            title="Available in Phase 2"
            className="inline-flex h-11 cursor-not-allowed items-center rounded-md bg-[var(--koya-accent)]/40 px-4 text-sm font-semibold text-white"
          >
            Generate with AI
          </button>
        </div>
      </header>

      {missing.length > 0 && (
        <div className="rounded-lg border border-amber-300/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Soft gaps</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {missing.map((key) => (
              <li key={key}>{HARD_FIELD_LABELS[key]}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--koya-line)] bg-white/70 p-6">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
            Intake summary
          </h2>
          <dl className="mt-4 space-y-4 text-sm">
            <SummaryRow label="Salesperson" value={proposal.salespersonName} />
            <SummaryRow label="Client email" value={proposal.clientEmail} />
            <SummaryRow
              label="Date of call"
              value={proposal.dateOfCall ?? ""}
            />
            <SummaryRow label="Needs" value={proposal.clientNeedsSummary} />
            <SummaryRow label="Scope" value={proposal.projectScope} />
            <ListRow label="Goals" items={proposal.goals ?? []} />
            <ListRow
              label="Services"
              items={proposal.recommendedServices ?? []}
            />
            <SummaryRow label="Timeline summary" value={proposal.proposedTimeline} />
            <PhasesRow phases={proposal.timelinePhases ?? []} />
            <SummaryRow label="Proposed price" value={proposal.proposedPrice} />
            <SummaryRow label="Price range" value={proposal.priceRange} />
            <SummaryRow label="Pricing notes" value={proposal.pricingNotes} />
            <SummaryRow
              label="Supporting material"
              value={proposal.supportingMaterial}
            />
          </dl>
        </div>

        <div className="rounded-xl border border-[var(--koya-line)] bg-white/70 p-6">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
            Activity
          </h2>
          <p className="mt-1 text-sm text-[var(--koya-muted)]">
            Event log for debugging and submission evidence.
          </p>
          <ul className="mt-4 space-y-3">
            {events.length === 0 && (
              <li className="text-sm text-[var(--koya-muted)]">No events yet.</li>
            )}
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-md border border-[var(--koya-line)]/70 bg-[var(--koya-mist)]/80 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--koya-accent)]">
                    {event.type}
                  </span>
                  <span className="text-xs text-[var(--koya-muted)]">
                    {event.createdAt.toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--koya-ink-soft)]">
                  {event.message}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="text-sm text-[var(--koya-muted)]">
        Phase 1 complete for this proposal: intake + hub. AI generation, section
        editing, approval, PDF, and email arrive in later phases.
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--koya-muted)]">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-[var(--koya-ink)]">
        {value?.trim() ? value : "—"}
      </dd>
    </div>
  );
}

function ListRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--koya-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-[var(--koya-ink)]">
        {items.length === 0 ? (
          "—"
        ) : (
          <ul className="list-disc space-y-1 pl-5">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </dd>
    </div>
  );
}

function PhasesRow({ phases }: { phases: TimelinePhase[] }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--koya-muted)]">
        Timeline phases
      </dt>
      <dd className="mt-1 text-[var(--koya-ink)]">
        {phases.length === 0 ? (
          "—"
        ) : (
          <ul className="space-y-2">
            {phases.map((p) => (
              <li key={p.phase} className="rounded-md bg-[var(--koya-mist)] px-3 py-2">
                <span className="font-semibold">Phase {p.phase}</span>
                {p.label ? ` — ${p.label}` : ""}
                <div className="text-[var(--koya-muted)]">
                  {[p.duration, p.deliveryWindow].filter(Boolean).join(" · ") ||
                    "No timing set"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </dd>
    </div>
  );
}
