import { eq } from "drizzle-orm";
import { db } from "@/db";
import { proposals } from "@/db/schema";
import { getAppBaseUrl } from "@/lib/app-url";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { ensurePublicBucket } from "@/lib/supabase/storage";
import { launchPdfBrowser } from "./browser";

const BUCKET = "proposal-pdfs";

/**
 * Renders /proposals/[id]/preview?print=1 (the static, non-hydrated variant —
 * see the preview page) to a PDF buffer via headless Chromium. The existing
 * @media print CSS (already used by the browser "Export PDF" button) applies
 * automatically via emulateMedia, including the @page margin, so no manual
 * margin options are passed here.
 */
export async function renderProposalPdf(proposalId: string): Promise<Buffer> {
  const url = `${getAppBaseUrl()}/proposals/${proposalId}/preview?print=1`;
  const browser = await launchPdfBrowser();

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    await page.emulateMedia({ media: "print" });
    const buffer = await page.pdf({ format: "A4", printBackground: true });
    return buffer;
  } finally {
    await browser.close();
  }
}

/** Uploads a rendered PDF buffer to Supabase Storage and returns its public URL. */
export async function uploadProposalPdf(
  proposalId: string,
  buffer: Buffer,
): Promise<string> {
  const supabase = createSupabaseAdmin();
  await ensurePublicBucket(supabase, BUCKET);

  const path = `proposals/${proposalId}/proposal.pdf`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Renders and stores a fresh PDF, updating proposals.pdf_url. Returns the
 * buffer too so callers that also need the raw bytes (e.g. an email
 * attachment) don't have to re-download the file they just uploaded.
 */
export async function renderAndStoreProposalPdf(
  proposalId: string,
): Promise<{ buffer: Buffer; url: string }> {
  const buffer = await renderProposalPdf(proposalId);
  const url = await uploadProposalPdf(proposalId, buffer);

  await db
    .update(proposals)
    .set({ pdfUrl: url, updatedAt: new Date() })
    .where(eq(proposals.id, proposalId));

  return { buffer, url };
}
