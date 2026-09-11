import Anthropic from "@anthropic-ai/sdk";
import { getClient, getModel, extractJsonFallback } from "./generate";
import { EXTRACT_INTAKE_SYSTEM_PROMPT } from "./prompts";
import {
  intakeExtractionResponseSchema,
  submitIntakeExtractionTool,
  type IntakeExtractionResponse,
} from "./schema";

async function runExtraction(
  userContent: Anthropic.Messages.MessageParam["content"],
): Promise<IntakeExtractionResponse> {
  const client = getClient();

  let message: Anthropic.Messages.Message;
  try {
    message = await client.messages.create({
      model: getModel(),
      max_tokens: 2048,
      temperature: 0.2,
      system: EXTRACT_INTAKE_SYSTEM_PROMPT,
      tools: [submitIntakeExtractionTool],
      tool_choice: { type: "tool", name: "submit_intake_extraction" },
      messages: [{ role: "user", content: userContent }],
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown Anthropic error";
    throw new Error(`Claude extraction failed: ${detail}`);
  }

  const toolBlock = message.content.find(
    (block) => block.type === "tool_use" && block.name === "submit_intake_extraction",
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

  const parsed = intakeExtractionResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid extraction payload: ${parsed.error.issues[0]?.message ?? "schema error"}`,
    );
  }

  return parsed.data;
}

export async function extractIntakeFromText(
  text: string,
): Promise<IntakeExtractionResponse> {
  const userMessage = `Extract structured intake fields from the following call summary. Call the submit_intake_extraction tool with your result.

CALL_SUMMARY:
${text}`;

  return runExtraction(userMessage);
}

export async function extractIntakeFromDocument(
  base64: string,
): Promise<IntakeExtractionResponse> {
  const userContent: Anthropic.Messages.MessageParam["content"] = [
    {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: base64 },
    },
    {
      type: "text",
      text: "Extract structured intake fields from the attached document. Call the submit_intake_extraction tool with your result.",
    },
  ];

  return runExtraction(userContent);
}
