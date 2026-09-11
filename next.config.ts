import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // playwright/playwright-core/@sparticuz/chromium are already on Next's
  // own default externalized-packages list; listed here explicitly anyway
  // for clarity given they ship native binaries.
  serverExternalPackages: [
    "sanitize-html",
    "playwright",
    "playwright-core",
    "@sparticuz/chromium",
  ],
};

export default nextConfig;
