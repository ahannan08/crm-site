import type { SessionUser, AppRole } from "../types";

export interface ProfileRow {
  id: string;
  organization_id: string | null;
  name: string;
  email: string;
  app_role: AppRole;
  agent_status: "active" | "inactive" | "deleted" | null;
  onboarding_complete: boolean;
}

export function profileToSession(profile: ProfileRow): SessionUser {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.app_role,
    authMode: "supabase",
    organizationId: profile.organization_id,
    onboardingComplete: profile.onboarding_complete,
  };
}
