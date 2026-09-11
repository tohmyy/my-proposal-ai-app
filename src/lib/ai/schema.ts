import { z } from "zod";
import { SECTION_KEYS } from "./prompts";

export const generateGapSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const generateSectionSchema = z.object({
  key: z.enum(SECTION_KEYS),
  title: z.string(),
  content: z.string(),
});

export const generateResponseSchema = z.object({
  status: z.enum(["ok", "needs_clarification"]),
  gaps: z.array(generateGapSchema).default([]),
  clarifying_questions: z.array(z.string()).default([]),
  sections: z.array(generateSectionSchema).default([]),
});

export type GenerateResponse = z.infer<typeof generateResponseSchema>;

/** Anthropic tool input schema (JSON Schema). */
export const submitProposalTool = {
  name: "submit_proposal",
  description:
    "Submit the generated proposal sections and clarification status.",
  input_schema: {
    type: "object" as const,
    properties: {
      status: {
        type: "string",
        enum: ["ok", "needs_clarification"],
      },
      gaps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: { type: "string" },
            message: { type: "string" },
          },
          required: ["field", "message"],
        },
      },
      clarifying_questions: {
        type: "array",
        items: { type: "string" },
      },
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            key: {
              type: "string",
              enum: [...SECTION_KEYS],
            },
            title: { type: "string" },
            content: { type: "string" },
          },
          required: ["key", "title", "content"],
        },
      },
    },
    required: ["status", "gaps", "clarifying_questions", "sections"],
  },
};

export const regenerateSectionResponseSchema = generateSectionSchema;

export type RegenerateSectionResponse = z.infer<
  typeof regenerateSectionResponseSchema
>;

/** Anthropic tool input schema for rewriting a single existing section. */
export const submitSectionTool = {
  name: "submit_section",
  description: "Submit the rewritten content for a single proposal section.",
  input_schema: {
    type: "object" as const,
    properties: {
      key: {
        type: "string",
        enum: [...SECTION_KEYS],
      },
      title: { type: "string" },
      content: { type: "string" },
    },
    required: ["key", "title", "content"],
  },
};

const timelinePhaseExtractionSchema = z.object({
  phase: z.number().int().positive().optional(),
  label: z.string().trim().optional(),
  duration: z.string().trim().optional(),
  deliveryWindow: z.string().trim().optional(),
});

/**
 * Every intake-like field is optional: an absent key means "not stated in
 * the source," distinct from an explicitly-found empty value. Never treat
 * a missing key as a signal to guess — see EXTRACT_INTAKE_SYSTEM_PROMPT.
 */
export const intakeExtractionResponseSchema = z.object({
  clientName: z.string().trim().optional(),
  clientEmail: z.string().trim().optional(),
  companyName: z.string().trim().optional(),
  dateOfCall: z.string().trim().optional(),
  salespersonName: z.string().trim().optional(),
  clientNeedsSummary: z.string().trim().optional(),
  projectScope: z.string().trim().optional(),
  goals: z.array(z.string().trim()).optional(),
  recommendedServices: z.array(z.string().trim()).optional(),
  proposedTimeline: z.string().trim().optional(),
  timelinePhases: z.array(timelinePhaseExtractionSchema).optional(),
  currency: z.string().trim().optional(),
  proposedPrice: z.string().trim().optional(),
  priceRange: z.string().trim().optional(),
  pricingNotes: z.string().trim().optional(),
  notFound: z.array(z.string()).default([]),
});

export type IntakeExtractionResponse = z.infer<
  typeof intakeExtractionResponseSchema
>;

/** Anthropic tool input schema for extracting intake fields from free text or a document. */
export const submitIntakeExtractionTool = {
  name: "submit_intake_extraction",
  description:
    "Submit intake fields extracted from a call summary or document. Omit any field not explicitly stated in the source — never guess or invent a value.",
  input_schema: {
    type: "object" as const,
    properties: {
      clientName: { type: "string" },
      clientEmail: { type: "string" },
      companyName: { type: "string" },
      dateOfCall: {
        type: "string",
        description:
          "ISO date YYYY-MM-DD, only if a specific date is explicitly stated",
      },
      salespersonName: { type: "string" },
      clientNeedsSummary: { type: "string" },
      projectScope: { type: "string" },
      goals: { type: "array", items: { type: "string" } },
      recommendedServices: { type: "array", items: { type: "string" } },
      proposedTimeline: { type: "string" },
      timelinePhases: {
        type: "array",
        items: {
          type: "object",
          properties: {
            phase: { type: "number" },
            label: { type: "string" },
            duration: { type: "string" },
            deliveryWindow: { type: "string" },
          },
        },
      },
      currency: { type: "string" },
      proposedPrice: { type: "string" },
      priceRange: { type: "string" },
      pricingNotes: { type: "string" },
      notFound: {
        type: "array",
        items: { type: "string" },
        description: "Names of intake fields you could not find in the source",
      },
    },
    required: ["notFound"],
  },
};
