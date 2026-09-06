import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { SessionUser } from "@/lib/types";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/onboarding",
  "/api/auth/login",
  "/api/auth/register",
  "/api/onboarding",
];

function parseSession(raw: string | undefined): SessionUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SessionUser> & Pick<SessionUser, "id" | "name" | "email" | "role">;
    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      authMode: parsed.authMode ?? "mock",
      organizationId: parsed.organizationId ?? null,
      onboardingComplete: parsed.onboardingComplete ?? true,
    };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = parseSession(request.cookies.get("visa_crm_session")?.value);

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isPublic) {
    if (session && pathname === "/login") {
      const dest =
        session.role === "super_admin"
          ? "/super-admin/requests"
          : session.authMode === "supabase" && !session.onboardingComplete
            ? "/onboarding"
            : "/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  if (!session && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session) {
    // Mock/demo sessions skip all gates
    if (session.authMode === "mock") {
      return NextResponse.next();
    }

    if (session.role === "super_admin") {
      if (!pathname.startsWith("/super-admin") && !pathname.startsWith("/api/super-admin")) {
        return NextResponse.redirect(new URL("/super-admin/requests", request.url));
      }
      return NextResponse.next();
    }

    if (!session.onboardingComplete && pathname !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    if (session.onboardingComplete && pathname === "/onboarding") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
