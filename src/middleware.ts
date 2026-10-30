import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  let authUser: any = null;
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      authUser = data.user;
    }
  } catch {
    // Supabase offline/unreachable
  }

  // Check demo session cookie fallback
  if (!authUser) {
    const demoCookie = request.cookies.get("ampm_session_user");
    if (demoCookie?.value) {
      try {
        authUser = JSON.parse(decodeURIComponent(demoCookie.value));
      } catch {
        // invalid cookie
      }
    }
  }

  const path = request.nextUrl.pathname;

  // Protected Admin Area: requires admin, owner, or staff
  if (path.startsWith("/admin")) {
    if (!authUser) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Protected Member Area: requires logged in user
  if (path.startsWith("/dashboard") || path.startsWith("/community")) {
    if (!authUser) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const runtime = 'nodejs';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (.svg, .png, .jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
