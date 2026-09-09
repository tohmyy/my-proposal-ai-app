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
