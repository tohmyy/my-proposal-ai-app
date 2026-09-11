"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StringListEditor } from "@/components/string-list-editor";
import { TimelinePhasesEditor } from "@/components/timeline-phases-editor";
import { RegenerateSectionsButton } from "@/components/regenerate-sections-button";
import { useToast } from "@/components/ui/toast";
import { regenerateAffectedSections } from "@/lib/proposals/generate-actions";
import {
  getMissingHardFields,
  HARD_FIELD_LABELS,
  localTodayIsoDate,
  mapClarificationGapsToControls,
  type ClarificationGap,
  type HardIntakeField,
  type IntakeInput,
} from "@/lib/proposals/types";
import {
  normalizeTemplateId,
  PROPOSAL_TEMPLATES,
  type TemplateId,
} from "@/lib/proposals/templates";
import type { Proposal, TimelinePhase } from "@/db/schema";
import { cn } from "@/lib/utils";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];

type IntakeFormProps = {
  action: (
    formData: FormData,
  ) => Promise<{ ok: false; error: string } | { ok: true } | void>;
  initial?: Proposal | null;
  submitLabel?: string;
  clarificationGaps?: ClarificationGap[];
  clarifyingQuestions?: string[];
  /** When true, template cannot be changed (sections already generated). */
  templateLocked?: boolean;
  /** Enables the regenerate/resync action bar (omit on the "new proposal" form). */
  proposalId?: string;
  hasGeneratedSections?: boolean;
  staleSectionTitles?: string[];
  skippedSectionTitles?: string[];
};

export function IntakeForm({
  action,
  initial,
  submitLabel = "Save draft",
  clarificationGaps = [],
  clarifyingQuestions = [],
  templateLocked = false,
  proposalId,
  hasGeneratedSections = false,
  staleSectionTitles = [],
  skippedSectionTitles = [],
}: IntakeFormProps) {
  const [values, setValues] = useState({
    title: initial?.title ?? "",
    clientName: initial?.clientName ?? "",
    clientEmail: initial?.clientEmail ?? "",
    companyName: initial?.companyName ?? "",
    dateOfCall: initial?.dateOfCall ?? "",
    salespersonName: initial?.salespersonName ?? "",
    clientNeedsSummary: initial?.clientNeedsSummary ?? "",
    projectScope: initial?.projectScope ?? "",
    proposedTimeline: initial?.proposedTimeline ?? "",
    currency: initial?.currency ?? "USD",
    proposedPrice: initial?.proposedPrice ?? "",
    priceRange: initial?.priceRange ?? "",
    pricingNotes: initial?.pricingNotes ?? "",
    supportingMaterial: initial?.supportingMaterial ?? "",
  });
  const [templateId, setTemplateId] = useState<TemplateId>(
    normalizeTemplateId(initial?.templateId),
  );
  const [goals, setGoals] = useState<string[]>(
    initial?.goals?.length ? initial.goals : [""],
  );
  const [services, setServices] = useState<string[]>(
    initial?.recommendedServices?.length ? initial.recommendedServices : [""],
  );
  const [timelinePhases, setTimelinePhases] = useState<TimelinePhase[]>(
    initial?.timelinePhases?.length
      ? initial.timelinePhases
      : [{ phase: 1, label: "", duration: "", deliveryWindow: "" }],
  );
  const [pending, setPending] = useState(false);
  const toast = useToast();

  // Snapshot of the form's already-defaulted first-render shape, used to
  // detect unsaved changes. Lazy so it's captured exactly once, from the
  // same state values above rather than re-derived from `initial`. Reset
  // to the just-saved shape on a successful submit (see onSubmit below) —
  // a redirect back to this same URL doesn't reliably remount the form, so
  // this can't just rely on `initial` changing.
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify({ values, templateId, goals, services, timelinePhases }),
  );
  // Only gate Save on "has anything changed" when editing an existing
  // proposal — the blank /proposals/new form has no baseline worth diffing
  // against and must stay immediately submittable.
  const isDirty =
    !initial ||
    JSON.stringify({ values, templateId, goals, services, timelinePhases }) !==
      baseline;

  const router = useRouter();
  const [regeneratePending, startRegenerateTransition] = useTransition();

  function handleRegenerate() {
    if (!proposalId) return;
    startRegenerateTransition(async () => {
      const result = await regenerateAffectedSections(proposalId);
      if (!result.ok) {
        toast.error(result.error);
        router.refresh();
        return;
      }
      router.refresh();
      if (result.regenerated.length > 0) {
        router.push(`/proposals/${proposalId}/preview`);
      }
    });
  }

  const fieldErrors = useMemo(
    () => mapClarificationGapsToControls(clarificationGaps),
    [clarificationGaps],
  );
  const hasClarification = clarificationGaps.length > 0;

  const canRegenerate =
    hasGeneratedSections &&
    !hasClarification &&
    staleSectionTitles.length > 0 &&
    !isDirty;

  const regenerateDisabledReason = isDirty
    ? "Save your changes first."
    : hasClarification
      ? "Resolve the clarification issues first."
      : staleSectionTitles.length === 0
        ? "No intake changes since the last generation."
        : undefined;

  const intakePreview: IntakeInput = useMemo(
    () => ({
      ...values,
      dateOfCall: values.dateOfCall || null,
      goals: goals.map((g) => g.trim()).filter(Boolean),
      recommendedServices: services.map((s) => s.trim()).filter(Boolean),
      timelinePhases: timelinePhases
        .map((p, i) => ({
          phase: i + 1,
          label: p.label?.trim() ?? "",
          duration: p.duration?.trim() ?? "",
          deliveryWindow: p.deliveryWindow?.trim() ?? "",
        }))
        .filter((p) => p.label || p.duration || p.deliveryWindow),
      title: values.title || null,
      templateId,
    }),
    [values, goals, services, timelinePhases, templateId],
  );

  const missingHard = useMemo(
    () => getMissingHardFields(intakePreview),
    [intakePreview],
  );

  function setField(key: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(formData: FormData) {
    setPending(true);
    try {
      const result = await action(formData);
      if (result && "ok" in result && result.ok === false) {
        toast.error(result.error);
      }
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
      ) {
        // The action only redirects after a successful save — treat the
        // just-submitted values as the new saved baseline.
        setBaseline(
          JSON.stringify({ values, templateId, goals, services, timelinePhases }),
        );
        throw err;
      }
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  const actionsProps = {
    pending,
    isDirty,
    submitLabel,
    missingHard,
    hasClarification,
    hasGeneratedSections,
    staleSectionTitles,
    skippedSectionTitles,
    canRegenerate,
    regenerateReason: regenerateDisabledReason,
    regeneratePending,
    onRegenerate: handleRegenerate,
  };

  return (
    <form action={onSubmit} className="space-y-10 animate-in-up">
      <IntakeFormActions {...actionsProps} />

      {hasClarification && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-950">
          <p className="font-semibold">Clarification needed</p>
          <p className="mt-1 text-rose-900/90">
            Highlighted fields below need more detail before generation can
            complete a full proposal. Fill them in, save, then generate again.
          </p>
          {clarifyingQuestions.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-rose-900">
              {clarifyingQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!hasClarification && missingHard.length > 0 && (
        <div className="rounded-lg border border-amber-300/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Soft gaps before generation</p>
          <p className="mt-1 text-amber-900/90">
            You can still save a draft — generation will ask for clarification if
            these remain empty:{" "}
            {missingHard.map((k) => HARD_FIELD_LABELS[k]).join(", ")}.
          </p>
        </div>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-[var(--koya-ink)]">
            Proposal style
          </h2>
          <p className="mt-1 text-sm text-[var(--koya-muted)]">
            {templateLocked
              ? "Locked after the first generate — preview and print use this skin."
              : "Choose how the finished proposal looks. You can change this until you generate."}
          </p>
        </div>
        <input type="hidden" name="templateId" value={templateId} />
        <div
          className="grid gap-3 sm:grid-cols-3"
          role="radiogroup"
          aria-label="Proposal style"
          aria-disabled={templateLocked}
        >
          {PROPOSAL_TEMPLATES.map((tpl) => {
            const selected = templateId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={templateLocked}
                onClick={() => setTemplateId(tpl.id)}
                className={cn(
                  "rounded-lg border px-3 py-3 text-left transition",
                  selected
                    ? "border-[var(--koya-accent)] bg-teal-50/60 shadow-[0_0_0_1px_var(--koya-accent)]"
                    : "border-[var(--koya-line)] bg-white hover:border-[var(--koya-accent)]/50",
                  templateLocked && "cursor-not-allowed opacity-90",
                )}
              >
                <span
                  className="mb-2 flex h-8 overflow-hidden rounded-md border border-[var(--koya-line)]"
                  aria-hidden
                >
                  {tpl.swatch.map((color) => (
                    <span
                      key={color}
                      className="flex-1"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
                <span className="block font-[family-name:var(--font-syne)] text-sm font-semibold text-[var(--koya-ink)]">
                  {tpl.name}
                </span>
                <span className="mt-1 block text-xs leading-snug text-[var(--koya-muted)]">
                  {tpl.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-[var(--koya-ink)]">
            Client & call
          </h2>
          <p className="mt-1 text-sm text-[var(--koya-muted)]">
            Who you spoke with and when.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="title"
            label="Proposal title"
            optional
            value={values.title}
            onChange={(v) => setField("title", v)}
            placeholder="Auto-filled from company if blank"
          />
          <Field
            id="salespersonName"
            label="Salesperson name"
            value={values.salespersonName}
            onChange={(v) => setField("salespersonName", v)}
            errorNote={fieldErrors.salespersonName}
          />
          <Field
            id="clientName"
            label="Client name"
            value={values.clientName}
            onChange={(v) => setField("clientName", v)}
            errorNote={fieldErrors.clientName}
          />
          <Field
            id="clientEmail"
            label="Client email"
            type="email"
            value={values.clientEmail}
            onChange={(v) => setField("clientEmail", v)}
            errorNote={fieldErrors.clientEmail}
          />
          <Field
            id="companyName"
            label="Company name"
            value={values.companyName}
            onChange={(v) => setField("companyName", v)}
            errorNote={fieldErrors.companyName}
          />
          <Field
            id="dateOfCall"
            label="Date of call"
            type="date"
            value={values.dateOfCall}
            onChange={(v) => setField("dateOfCall", v)}
            max={localTodayIsoDate()}
            errorNote={fieldErrors.dateOfCall}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-[var(--koya-ink)]">
            Needs & scope
          </h2>
          <p className="mt-1 text-sm text-[var(--koya-muted)]">
            Discovery notes that drive the proposal narrative.
          </p>
        </div>
        <div className="grid gap-4">
          <Area
            id="clientNeedsSummary"
            label="Summary of client's needs"
            hard
            value={values.clientNeedsSummary}
            onChange={(v) => setField("clientNeedsSummary", v)}
            rows={4}
            errorNote={fieldErrors.clientNeedsSummary}
          />
          <Area
            id="projectScope"
            label="Project scope"
            hard
            value={values.projectScope}
            onChange={(v) => setField("projectScope", v)}
            rows={4}
            errorNote={fieldErrors.projectScope}
          />
          <StringListEditor
            label="Goals and objectives"
            name="goalsJson"
            items={goals}
            onChange={setGoals}
            placeholder="e.g. Reduce manual reporting"
            errorNote={fieldErrors.goals}
          />
          <StringListEditor
            label="Recommended services or deliverables"
            name="recommendedServicesJson"
            items={services}
            onChange={setServices}
            placeholder="e.g. Discovery workshop"
            errorNote={fieldErrors.recommendedServices}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2
            className={cn(
              "font-[family-name:var(--font-syne)] text-xl font-semibold",
              (fieldErrors.proposedTimeline || fieldErrors.timelinePhases) &&
                "text-rose-800",
            )}
          >
            Timeline
          </h2>
          <p className="mt-1 text-sm text-[var(--koya-muted)]">
            Provide a summary and/or structured phases — never invent these later
            with AI.
          </p>
        </div>
        <Area
          id="proposedTimeline"
          label="Timeline summary"
          hard
          value={values.proposedTimeline}
          onChange={(v) => setField("proposedTimeline", v)}
          rows={3}
          placeholder="e.g. 6–8 weeks from kickoff, including feedback cycles"
          errorNote={fieldErrors.proposedTimeline}
        />
        <TimelinePhasesEditor
          phases={timelinePhases}
          onChange={setTimelinePhases}
          errorNote={fieldErrors.timelinePhases}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2
            className={cn(
              "font-[family-name:var(--font-syne)] text-xl font-semibold",
              (fieldErrors.proposedPrice || fieldErrors.priceRange) &&
                "text-rose-800",
            )}
          >
            Pricing
          </h2>
          <p className="mt-1 text-sm text-[var(--koya-muted)]">
            Need a proposed price <em>or</em> a range. Notes alone are not enough.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              id="currency"
              name="currency"
              value={values.currency}
              onChange={(e) => setField("currency", e.target.value)}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </Select>
          </div>
          <Field
            id="proposedPrice"
            label="Proposed price"
            value={values.proposedPrice}
            onChange={(v) => setField("proposedPrice", v)}
            placeholder="e.g. $12,000"
            invalid={Boolean(
              fieldErrors.proposedPrice || fieldErrors.priceRange,
            )}
          />
          <Field
            id="priceRange"
            label="Price range"
            value={values.priceRange}
            onChange={(v) => setField("priceRange", v)}
            placeholder="e.g. $10k–$15k"
            invalid={Boolean(
              fieldErrors.proposedPrice || fieldErrors.priceRange,
            )}
          />
        </div>
        {(fieldErrors.proposedPrice || fieldErrors.priceRange) && (
          <p className="text-sm text-rose-700">
            {fieldErrors.proposedPrice || fieldErrors.priceRange}
          </p>
        )}
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--koya-accent)]">
          Required for generate: proposed price or price range
        </p>
        <Area
          id="pricingNotes"
          label="Pricing notes"
          optional
          value={values.pricingNotes}
          onChange={(v) => setField("pricingNotes", v)}
          rows={3}
          placeholder="Payment terms, exclusions, assumptions…"
          errorNote={fieldErrors.pricingNotes}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-[var(--koya-ink)]">
            Supporting material
          </h2>
          <p className="mt-1 text-sm text-[var(--koya-muted)]">
            Paste call notes or excerpts. Used in generation when relevant.
          </p>
        </div>
        <Area
          id="supportingMaterial"
          label="Notes / excerpts"
          optional
          value={values.supportingMaterial}
          onChange={(v) => setField("supportingMaterial", v)}
          rows={5}
          placeholder="Paste distinctive phrases or constraints from the discovery call…"
          errorNote={fieldErrors.supportingMaterial}
        />
      </section>

      <div className="border-t border-[var(--koya-line)] pt-6">
        <IntakeFormActions {...actionsProps} />
      </div>
    </form>
  );
}

function IntakeFormActions({
  pending,
  isDirty,
  submitLabel,
  missingHard,
  hasClarification,
  hasGeneratedSections,
  staleSectionTitles,
  skippedSectionTitles,
  canRegenerate,
  regenerateReason,
  regeneratePending,
  onRegenerate,
}: {
  pending: boolean;
  isDirty: boolean;
  submitLabel: string;
  missingHard: HardIntakeField[];
  hasClarification: boolean;
  hasGeneratedSections: boolean;
  staleSectionTitles: string[];
  skippedSectionTitles: string[];
  canRegenerate: boolean;
  regenerateReason?: string;
  regeneratePending: boolean;
  onRegenerate: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !isDirty} size="lg">
          {pending ? "Saving…" : submitLabel}
        </Button>
        {missingHard.length === 0 && !hasClarification && (
          <p className="text-sm font-medium text-[var(--koya-accent)]">
            Hard fields complete — ready to generate.
          </p>
        )}
        {hasClarification && (
          <p className="text-sm text-rose-700">
            Resolve highlighted fields, save, then regenerate from the hub.
          </p>
        )}
      </div>

      {hasGeneratedSections && (
        <div className="rounded-lg border border-[var(--koya-accent)]/40 bg-teal-50/70 px-4 py-3 text-sm text-[var(--koya-ink)]">
          {staleSectionTitles.length > 0 && (
            <>
              <p className="font-semibold">
                Intake changes affect {staleSectionTitles.length} section
                {staleSectionTitles.length > 1 ? "s" : ""}
              </p>
              <p className="mt-1 text-[var(--koya-ink-soft)]">
                {staleSectionTitles.join(", ")}
              </p>
            </>
          )}
          {skippedSectionTitles.length > 0 && (
            <p
              className={cn(
                staleSectionTitles.length > 0 ? "mt-1" : "",
                "text-[var(--koya-muted)]",
              )}
            >
              Skipping {skippedSectionTitles.length} section
              {skippedSectionTitles.length > 1 ? "s" : ""} you&rsquo;ve edited
              manually: {skippedSectionTitles.join(", ")}
              {staleSectionTitles.length === 0 &&
                " — edit it yourself if it needs to reflect the change."}
            </p>
          )}
          <div className="mt-3">
            <RegenerateSectionsButton
              pending={regeneratePending}
              disabled={!canRegenerate}
              disabledReason={regenerateReason}
              onClick={onRegenerate}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  optional,
  hard,
  placeholder,
  errorNote,
  invalid,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  optional?: boolean;
  hard?: boolean;
  placeholder?: string;
  errorNote?: string;
  invalid?: boolean;
  max?: string;
}) {
  const showError = Boolean(errorNote || invalid);
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={showError ? "text-rose-800" : undefined}>
        {label}
        {hard && (
          <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-[var(--koya-accent)]">
            required for generate*
          </span>
        )}
        {optional && (
          <span className="ml-2 text-xs font-normal text-[var(--koya-muted)]">
            optional
          </span>
        )}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        max={max}
        placeholder={placeholder}
        aria-invalid={showError}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          showError &&
            "border-rose-500 focus-visible:ring-rose-400 bg-rose-50/40",
        )}
      />
      {errorNote && <p className="text-sm text-rose-700">{errorNote}</p>}
    </div>
  );
}

function Area({
  id,
  label,
  value,
  onChange,
  rows = 4,
  hard,
  optional,
  placeholder,
  errorNote,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hard?: boolean;
  optional?: boolean;
  placeholder?: string;
  errorNote?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={errorNote ? "text-rose-800" : undefined}>
        {label}
        {hard && (
          <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-[var(--koya-accent)]">
            required for generate
          </span>
        )}
        {optional && (
          <span className="ml-2 text-xs font-normal text-[var(--koya-muted)]">
            optional
          </span>
        )}
      </Label>
      <Textarea
        id={id}
        name={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(errorNote)}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          errorNote &&
            "border-rose-500 focus-visible:ring-rose-400 bg-rose-50/40",
        )}
      />
      {errorNote && <p className="text-sm text-rose-700">{errorNote}</p>}
    </div>
  );
}
