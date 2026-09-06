import { cookies } from "next/headers";
import type { SessionUser } from "./types";

const SESSION_COOKIE = "visa_crm_session";

export async function setSession(user: SessionUser): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
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

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
