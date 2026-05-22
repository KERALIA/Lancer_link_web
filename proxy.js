import { NextResponse } from "next/server";
import { createSupabaseProxyClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getRoleForEmail } from "@/lib/auth";
import { authenticateRequest } from "@/lib/api-auth";

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    let response = NextResponse.next({ request });
    const supabase = createSupabaseProxyClient(request, response);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/dashboard/admin")) {
      if (!isSupabaseConfigured()) {
        const url = new URL("/dashboard", request.url);
        url.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(url);
      }

      const role = await getRoleForEmail(user.email);
      if (role !== "admin") {
        const url = new URL("/dashboard", request.url);
        url.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(url);
      }
    }

    return response;
  }

  // Protect API routes
  if (pathname.startsWith("/api/")) {
    // Skip authentication for certain public API routes if needed
    const publicPaths = [
      "/api/auth/send-otp",
      "/api/auth/logout",
      "/api/contact"
    ];
    
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }
    
    // Authenticate API requests
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // For admin-specific API routes, check role
    if (pathname.startsWith("/api/admin")) {
      if (auth.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }
    
    return NextResponse.next();
  }

  // For all other routes, allow access
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
