import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 Proxy (the file convention formerly known as Middleware).
 *
 * Responsibilities:
 *  1. Refresh the Supabase auth session on every matched request.
 *  2. Optimistically gate the citizen area:
 *     - unauthenticated visitors are sent to /login
 *     - signed-in non-citizen accounts (lawyer/admin) are sent to /
 *
 * The page-level server check in `app/citizen/dashboard/page.tsx` remains the
 * real authorization boundary — this is only a fast redirect for UX.
 */

const CITIZEN_PREFIX = "/citizen";

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Only guard the citizen area.
  if (!pathname.startsWith(CITIZEN_PREFIX)) {
    return response;
  }

  // Not signed in -> go to login, remembering where they wanted to go.
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed in. If the auth metadata explicitly marks a non-citizen role
  // (lawyer/admin), bounce them out of the citizen area early. When the role
  // is unknown we let the request through — the dashboard's server check reads
  // the authoritative `public.users.role` and redirects if needed.
  const role = (user.user_metadata?.role as string | undefined) ?? null;
  if (role && role !== "citizen") {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on all request paths except Next.js internals and static assets so
     * auth cookies stay fresh, while avoiding needless work on files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
