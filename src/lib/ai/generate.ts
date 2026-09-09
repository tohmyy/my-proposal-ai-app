import Anthropic from "@anthropic-ai/sdk";
import type { IntakeInput } from "@/lib/proposals/types";
import { GENERATE_SYSTEM_PROMPT } from "./prompts";
import {
  generateResponseSchema,
  submitProposalTool,
  type GenerateResponse,
} from "./schema";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.",
    );
  }
  return new Anthropic({ apiKey });
}

function getModel() {
  return process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
}

function intakePayload(intake: IntakeInput) {
  return {
    client_name: intake.clientName,
    client_email: intake.clientEmail,
    company_name: intake.companyName,
    date_of_call: intake.dateOfCall,
    salesperson_name: intake.salespersonName,
    client_needs_summary: intake.clientNeedsSummary,
    project_scope: intake.projectScope,
    goals: intake.goals,
    recommended_services: intake.recommendedServices,
    proposed_timeline: intake.proposedTimeline,
    timeline_phases: intake.timelinePhases.map((p) => ({
      phase: p.phase,
      label: p.label,
      duration: p.duration,
      deliveryWindow: p.deliveryWindow,
    })),
    currency: intake.currency,
    proposed_price: intake.proposedPrice,
    price_range: intake.priceRange,
    pricing_notes: intake.pricingNotes,
  };
}

function extractJsonFallback(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1]?.trim() ?? text.trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model response did not contain JSON");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function generateProposalContent(
  intake: IntakeInput,
): Promise<GenerateResponse> {
  const client = getClient();
  const supporting = intake.supportingMaterial?.trim() || "(none)";

  const userMessage = `Generate a proposal from this intake JSON and optional supporting material.

INTAKE:
${JSON.stringify(intakePayload(intake), null, 2)}

SUPPORTING_MATERIAL:
${supporting}

Call the submit_proposal tool with your result.`;

  let message: Anthropic.Messages.Message;
  try {
    message = await client.messages.create({
      model: getModel(),
      max_tokens: 4096,
      temperature: 0.3,
      system: GENERATE_SYSTEM_PROMPT,
      tools: [submitProposalTool],
      tool_choice: { type: "tool", name: "submit_proposal" },
      messages: [{ role: "user", content: userMessage }],
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown Anthropic error";
    throw new Error(`Claude generate failed: ${detail}`);
  }

  const toolBlock = message.content.find(
    (block) => block.type === "tool_use" && block.name === "submit_proposal",
  );

  let raw: unknown;
  if (toolBlock && toolBlock.type === "tool_use") {
    raw = toolBlock.input;
  } else {
    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n");
    raw = extractJsonFallback(text);
  }

  const parsed = generateResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid generate payload: ${parsed.error.issues[0]?.message ?? "schema error"}`,
    );
  }

  return parsed.data;
}
