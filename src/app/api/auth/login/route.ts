import { NextRequest, NextResponse } from "next/server";
import { setSession } from "@/lib/auth";
import { tryMockLogin, isDemoAccount } from "@/lib/mock-auth";
import { getUserByEmail, updateLastLogin } from "@/lib/db";
import { recordLogin } from "@/lib/crm";
import { isSupabaseConfigured } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import { profileToSession, type ProfileRow } from "@/lib/supabase/profile";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Demo accounts: no Supabase, approval, onboarding, or inactive checks
  const mockSession = tryMockLogin(normalizedEmail, password);
  if (mockSession) {
    updateLastLogin(mockSession.id);
    await setSession(mockSession);
    return NextResponse.json({
      user: {
        id: mockSession.id,
        name: mockSession.name,
        email: mockSession.email,
        role: mockSession.role,
      },
    });
  }

  // Legacy JSON users (non-demo) — keep existing behavior
  if (!isDemoAccount(normalizedEmail)) {
    const user = getUserByEmail(normalizedEmail);
    if (user && user.password === password) {
      if (user.role === "agent" && (user.agent_status === "inactive" || user.agent_status === "deleted")) {
        return NextResponse.json(
          { error: "Your account is inactive. Contact admin." },
          { status: 403 }
        );
      }
      updateLastLogin(user.id);
      await setSession({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        authMode: "mock",
        organizationId: null,
        onboardingComplete: true,
      });
      return NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, name, email, app_role, agent_status, onboarding_complete")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Profile not found" }, { status: 401 });
  }

  const row = profile as ProfileRow;
  if (
    row.app_role === "agent" &&
    (row.agent_status === "inactive" || row.agent_status === "deleted")
  ) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Your account is inactive. Contact admin." },
      { status: 403 }
    );
  }

  const session = profileToSession(row);
  await recordLogin(session.id, session);
  await setSession(session);

  return NextResponse.json({
    user: {
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.role,
      onboardingComplete: session.onboardingComplete,
    },
  });
}
