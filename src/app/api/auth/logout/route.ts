import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isMockSession } from "@/lib/mock-auth";
import { isSupabaseConfigured } from "@/lib/registration";

const SESSION_COOKIE = "visa_crm_session";

async function performLogout() {
  const session = await getSession();

  if (session && !isMockSession(session) && isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore Supabase sign-out errors — app session will still be cleared
    }
  }
}

function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

export async function GET(request: NextRequest) {
  await performLogout();
  const response = NextResponse.redirect(new URL("/login", request.url));
  return clearSessionCookie(response);
}

export async function POST(request: NextRequest) {
  await performLogout();
  const response = NextResponse.json({ ok: true });
  return clearSessionCookie(response);
}
