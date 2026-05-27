import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

const protectedRoutes = ["/studio", "/api/projects", "/api/render-jobs"];

export async function proxy(request: NextRequest) {
  if (!hasSupabaseAuthEnv()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtected && !user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && user) {
    const studioUrl = request.nextUrl.clone();
    studioUrl.pathname = "/studio";
    studioUrl.search = "";
    return NextResponse.redirect(studioUrl);
  }

  return response;
}

function hasSupabaseAuthEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export const config = {
  matcher: [
    "/studio",
    "/studio/:path*",
    "/api/projects",
    "/api/projects/:path*",
    "/api/render-jobs",
    "/api/render-jobs/:path*",
    "/login",
  ],
};
