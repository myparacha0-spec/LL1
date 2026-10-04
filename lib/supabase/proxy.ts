import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session for an incoming request and returns a
 * response that carries any updated auth cookies.
 *
 * This is used by the root Proxy (Next.js 16's renamed Middleware — see
 * `proxy.ts`). It is a lightweight, optimistic check: it keeps the session
 * cookie fresh and tells the caller who is signed in, but it is NOT the
 * authorization boundary. Every protected page still verifies the user on the
 * server before rendering.
 *
 * NOTE: This file lives in `lib/supabase/` and does not collide with the
 * `lib/supabase/server.ts` helper used by Server Components.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without credentials we cannot refresh a session; let the request through
  // and let the page-level server check handle authentication.
  if (!supabaseUrl || !supabaseAnonKey) {
    return { response, user: null };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Keep the request cookies in sync so downstream reads see the
        // refreshed tokens, then mirror them onto the outgoing response.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: do not run other logic between creating the client and calling
  // getUser() — it can cause the session refresh to be missed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
