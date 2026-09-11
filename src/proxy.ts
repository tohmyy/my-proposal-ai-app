import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// This app's own preview page is deliberately excluded — it's the
// client-facing link `sendProposalEmail` emails out, and clients aren't
// users of this internal tool. Everything else requires sign-in.
const PUBLIC_PATHS = new Set(["/sign-in", "/sign-up"]);
const PREVIEW_PATH_RE = /^\/proposals\/[^/]+\/preview\/?$/;

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};

// Cookie-presence check only (per better-auth's own docs, this does not
// validate the session) — a fast UX-level redirect. The real security
// boundary for approving/rejecting a proposal lives in the server actions
// themselves (see src/lib/proposals/actions.ts), independent of this.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (PUBLIC_PATHS.has(pathname) || PREVIEW_PATH_RE.test(pathname)) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}
