import type { Proposal, ProposalSection, Settings } from "@/db/schema";
import { InlineText } from "@/components/inline-text";
import { InlineSectionBody } from "@/components/inline-section-body";
import { InlineEditProvider } from "@/components/inline-edit-context";
import { saveProposalHeaderField } from "@/lib/proposals/actions";
import { saveSectionTitle } from "@/lib/proposals/generate-actions";
import { getProposalTemplate } from "@/lib/proposals/templates";
import { cn } from "@/lib/utils";

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
  settings,
  editable = true,
}: {
  proposal: Proposal;
  sections: ProposalSection[];
  settings: Settings;
  editable?: boolean;
}) {
  const template = getProposalTemplate(proposal.templateId);
  const clientLabel =
    proposal.companyName?.trim() ||
    proposal.clientName?.trim() ||
    "your organization";
  const dateLabel = formatCallDate(proposal.dateOfCall);
  const senderCompanyName = settings.senderCompanyName?.trim() || "Koya Talent";
  const senderDesignation = settings.senderDesignation?.trim();

  const article = (
    <article
      data-template={template.id}
      className={cn(
        "proposal-document print-root mx-auto w-full max-w-3xl",
        template.className,
      )}
    >
      <header className="proposal-doc-header">
        <div className="proposal-doc-brand-row">
          {settings.senderLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.senderLogoUrl}
              alt={senderCompanyName}
              className="proposal-doc-logo"
            />
          )}
          <p className="proposal-doc-brand">{senderCompanyName}</p>
        </div>
        <h1 className="proposal-doc-title">Proposal for {clientLabel}</h1>
        <div className="proposal-doc-meta">
          {editable ? (
            <p>
              Prepared by{" "}
              <InlineText
                id="header:salespersonName"
                value={proposal.salespersonName ?? ""}
                emptyLabel="add name"
                onSave={saveProposalHeaderField.bind(
                  null,
                  proposal.id,
                  "salespersonName",
                )}
              />
            </p>
          ) : (
            proposal.salespersonName?.trim() && (
              <p>Prepared by {proposal.salespersonName.trim()}</p>
            )
          )}
          {editable ? (
            <p>
              Date:{" "}
              <InlineText
                id="header:dateOfCall"
                value={proposal.dateOfCall ?? ""}
                type="date"
                emptyLabel="add date"
                onSave={saveProposalHeaderField.bind(
                  null,
                  proposal.id,
                  "dateOfCall",
                )}
              />
            </p>
          ) : (
            dateLabel && <p>Date: {dateLabel}</p>
          )}
          {editable ? (
            <p>
              Prepared for{" "}
              <InlineText
                id="header:clientName"
                value={proposal.clientName ?? ""}
                emptyLabel="add client name"
                onSave={saveProposalHeaderField.bind(
                  null,
                  proposal.id,
                  "clientName",
                )}
              />
              ,{" "}
              <InlineText
                id="header:companyName"
                value={proposal.companyName ?? ""}
                emptyLabel="add company"
                onSave={saveProposalHeaderField.bind(
                  null,
                  proposal.id,
                  "companyName",
                )}
              />
            </p>
          ) : (
            proposal.clientName?.trim() &&
            proposal.companyName?.trim() && (
              <p>
                Prepared for {proposal.clientName.trim()}
                {proposal.companyName.trim()
                  ? `, ${proposal.companyName.trim()}`
                  : ""}
              </p>
            )
          )}
        </div>
      </header>

      <div className="proposal-doc-sections">
        {sections.map((section, index) => (
          <section key={section.id} className="proposal-doc-section">
            <h2 className="proposal-doc-section-title">
              {index + 1}.{" "}
              {editable ? (
                <InlineText
                  id={`section-title:${section.key}`}
                  value={section.title}
                  onSave={saveSectionTitle.bind(null, proposal.id, section.key)}
                />
              ) : (
                section.title
              )}
            </h2>
            {editable ? (
              <InlineSectionBody
                id={`section-body:${section.key}`}
                proposalId={proposal.id}
                section={section}
              />
            ) : (
              <div
                className="prose-koya mt-4"
                dangerouslySetInnerHTML={{ __html: section.htmlContent }}
              />
            )}
          </section>
        ))}
      </div>

      <footer className="proposal-doc-footer">
        <p>Looking forward to working together.</p>
        {proposal.salespersonName?.trim() && (
          <p className="mt-4">
            Warm regards,
            <br />
            {proposal.salespersonName.trim()}
            {senderDesignation ? `, ${senderDesignation}` : ""}
            <br />
            {senderCompanyName}
          </p>
        )}
      </footer>
    </article>
  );

  return editable ? <InlineEditProvider>{article}</InlineEditProvider> : article;
}
