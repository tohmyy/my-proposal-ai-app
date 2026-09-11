/**
 * Absolute base URL for this app's own routes — used for client-email
 * proposal links and for Chromium navigating to `/preview?print=1` for PDF.
 *
 * Order of preference:
 * 1. `NEXT_PUBLIC_APP_URL` (set this on Vercel to your public production URL)
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` (stable prod domain; avoids ephemeral
 *    `*.vercel.app` deployment URLs that often require Vercel login)
 * 3. `VERCEL_URL` (current deployment — may be SSO-protected on Preview)
 * 4. localhost
 */
export function getAppBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return normalizeBaseUrl(fromEnv);

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) return normalizeBaseUrl(productionHost);

  const deploymentHost = process.env.VERCEL_URL?.trim();
  if (deploymentHost) return normalizeBaseUrl(deploymentHost);

  return "http://localhost:3000";
}

function normalizeBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}
