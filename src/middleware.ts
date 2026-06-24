import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        error:
          "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      { status: 500 }
    );
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Legacy /dashboard/* → top-level workspace URLs (preserves query string)
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    const url = request.nextUrl.clone();
    let nextPath = pathname.replace(/^\/dashboard/, "");
    if (nextPath === "" || nextPath === "/") {
      url.pathname = "/";
    } else {
      url.pathname = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
    }
    return NextResponse.redirect(url);
  }

  const workspaceRoots = ["/drafts", "/saved-drafts", "/research", "/templates", "/settings"];
  const needsAuth =
    pathname === "/" ||
    workspaceRoots.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (!user && (needsAuth || isAdminRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  if (user && (needsAuth || isAdminRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_disabled")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.is_disabled) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("disabled", "1");
      return NextResponse.redirect(url);
    }
  }

  if (user && isAdminRoute) {
    const meta = user.user_metadata ?? {};
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isAdmin =
      meta.role === "admin" ||
      (user.email ? adminEmails.includes(user.email.toLowerCase()) : false);
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  if (
    user &&
    (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
