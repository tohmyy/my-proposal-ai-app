import Anthropic from "@anthropic-ai/sdk";
import type { IntakeInput } from "@/lib/proposals/types";
import {
  extractJsonFallback,
  getClient,
  getModel,
  intakePayload,
} from "./generate";
import { REGENERATE_SECTION_SYSTEM_PROMPT } from "./prompts";
import {
  regenerateSectionResponseSchema,
  submitSectionTool,
  type RegenerateSectionResponse,
} from "./schema";

export async function regenerateSection(
  intake: IntakeInput,
  currentSections: { key: string; title: string; content: string }[],
  targetKey: string,
  instruction = "Update this section to reflect the latest intake changes.",
): Promise<RegenerateSectionResponse> {
  const client = getClient();

  const userMessage = `Rewrite ONE section of this proposal.

INTAKE:
${JSON.stringify(intakePayload(intake), null, 2)}

CURRENT SECTIONS (for context/consistency only — do not return these):
${JSON.stringify(currentSections, null, 2)}

TARGET SECTION KEY: ${targetKey}

INSTRUCTION: ${instruction}

Call the submit_section tool with your result.`;

  let message: Anthropic.Messages.Message;
  try {
    message = await client.messages.create({
      model: getModel(),
      max_tokens: 2048,
      temperature: 0.3,
      system: REGENERATE_SECTION_SYSTEM_PROMPT,
      tools: [submitSectionTool],
      tool_choice: { type: "tool", name: "submit_section" },
      messages: [{ role: "user", content: userMessage }],
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown Anthropic error";
    throw new Error(`Claude regenerate failed: ${detail}`);
  }

  const toolBlock = message.content.find(
    (block) => block.type === "tool_use" && block.name === "submit_section",
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

  const parsed = regenerateSectionResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid regenerate payload: ${parsed.error.issues[0]?.message ?? "schema error"}`,
    );
  }

  return parsed.data;
}
