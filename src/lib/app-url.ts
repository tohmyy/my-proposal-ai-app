/**
 * Absolute base URL for this app's own routes, used both for the link in
 * client emails and for the server's own internal navigation when rendering
 * a page to PDF. NEXT_PUBLIC_APP_URL wins when set; VERCEL_URL (only present
 * at runtime on Vercel, no protocol) covers preview/production deployments
 * where it isn't; localhost is the dev fallback.
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
