"use server";

import {
  extractIntakeFromDocument,
  extractIntakeFromText,
} from "@/lib/ai/extract-intake";
import type { IntakeExtractionResponse } from "@/lib/ai/schema";

const MAX_SUMMARY_CHARS = 20_000;
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
const TEXT_MIME_TYPES = ["text/plain", "text/markdown"];

export type ExtractIntakeResult =
  | { ok: true; data: IntakeExtractionResponse }
  | { ok: false; error: string };

export async function extractIntakeFromSummary(
  formData: FormData,
): Promise<ExtractIntakeResult> {
  const text = String(formData.get("summary") ?? "").trim();
  if (!text) {
    return { ok: false, error: "Paste a call summary first." };
  }
  if (text.length > MAX_SUMMARY_CHARS) {
    return {
      ok: false,
      error: `That's a lot of text — trim it to under ${MAX_SUMMARY_CHARS.toLocaleString()} characters.`,
    };
  }

  try {
    const data = await extractIntakeFromText(text);
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Extraction failed",
    };
  }
}

export async function extractIntakeFromFile(
  formData: FormData,
): Promise<ExtractIntakeResult> {
  const file = formData.get("document");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file first." };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { ok: false, error: "File must be smaller than 15MB." };
  }

  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const isText =
    TEXT_MIME_TYPES.includes(file.type) || /\.(txt|md)$/i.test(file.name);

  if (!isPdf && !isText) {
    return {
      ok: false,
      error: "Only PDF or plain text (.txt/.md) files are supported.",
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = isPdf
      ? await extractIntakeFromDocument(buffer.toString("base64"))
      : await extractIntakeFromText(buffer.toString("utf-8"));
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Extraction failed",
    };
  }
}
