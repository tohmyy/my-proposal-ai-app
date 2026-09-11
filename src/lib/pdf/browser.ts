/**
 * Local dev uses `playwright` (pinned to match the machine's cached
 * Chromium build) while production uses `playwright-core` at whatever
 * version is current — the two packages' own `Browser`/`Page` types aren't
 * guaranteed assignable to each other across versions. This app only needs
 * the handful of methods below, so a narrow structural type here sidesteps
 * that mismatch entirely instead of casting between the two packages' types.
 */
export type PdfPage = {
  goto(url: string, options?: { waitUntil?: "networkidle" }): Promise<unknown>;
  emulateMedia(options: { media: "print" }): Promise<void>;
  pdf(options: { format?: string; printBackground?: boolean }): Promise<Buffer>;
};

export type PdfBrowser = {
  newPage(): Promise<PdfPage>;
  close(): Promise<void>;
};

/**
 * Launches headless Chromium for server-side PDF rendering.
 *
 * On Vercel/Lambda, @sparticuz/chromium ships a Linux-only binary built for
 * serverless runtimes, driven via playwright-core (which brings no browser
 * of its own). Locally, full `playwright` manages its own cached Chromium
 * build and is used directly — @sparticuz/chromium's binary cannot run on
 * Windows, so this split is required, not just an optimization.
 */
export async function launchPdfBrowser(): Promise<PdfBrowser> {
  const isServerless = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
  );

  if (isServerless) {
    const [{ default: chromium }, { chromium: playwrightChromium }] =
      await Promise.all([import("@sparticuz/chromium"), import("playwright-core")]);

    return playwrightChromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const { chromium: playwrightChromium } = await import("playwright");
  return playwrightChromium.launch({ headless: true });
}
