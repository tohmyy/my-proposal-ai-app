"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StringListEditor } from "@/components/string-list-editor";
import { TimelinePhasesEditor } from "@/components/timeline-phases-editor";
import {
  getMissingHardFields,
  HARD_FIELD_LABELS,
  mapClarificationGapsToControls,
  type ClarificationGap,
  type IntakeInput,
} from "@/lib/proposals/types";
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
};

export function IntakeForm({
  action,
  initial,
  submitLabel = "Save draft",
  clarificationGaps = [],
  clarifyingQuestions = [],
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
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const fieldErrors = useMemo(
    () => mapClarificationGapsToControls(clarificationGaps),
    [clarificationGaps],
  );
  const hasClarification = clarificationGaps.length > 0;

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
    }),
    [values, goals, services, timelinePhases],
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
    setError(null);
    try {
      const result = await action(formData);
      if (result && "ok" in result && result.ok === false) {
        setError(result.error);
      }
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-10 animate-in-up">
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

      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      )}

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

      <div className="flex items-center gap-3 border-t border-[var(--koya-line)] pt-6">
        <Button type="submit" disabled={pending} size="lg">
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
    </form>
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
