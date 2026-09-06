import { getUserByEmail } from "./db";
import type { SessionUser, User } from "./types";

/** Demo accounts from seed.json — bypass Supabase, approval, onboarding, and inactive checks. */
export const DEMO_ACCOUNT_EMAILS = new Set([
  "admin@visa.com",
  "priya@visa.com",
  "rahul@visa.com",
]);

export function isDemoAccount(email: string): boolean {
  return DEMO_ACCOUNT_EMAILS.has(email.trim().toLowerCase());
}

/** Demo accounts from seed.json — bypass Supabase, approval, and onboarding. */
export function tryMockLogin(email: string, password: string): SessionUser | null {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isDemoAccount(normalizedEmail)) {
    return null;
  }
  const user = getUserByEmail(normalizedEmail);
  if (!user || user.password !== password) {
    return null;
  }
  return mockSessionFromUser(user);
}

export function isMockSession(session: SessionUser | null): boolean {
  return session?.authMode === "mock";
}

export function mockSessionFromUser(user: User): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    authMode: "mock",
    organizationId: null,
    onboardingComplete: true,
  };
}
