import { NextRequest, NextResponse } from "next/server";
import { getRegistrationByToken, completeOnboarding } from "@/lib/registration";
import { setSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { profileToSession, type ProfileRow } from "@/lib/supabase/profile";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const registration = await getRegistrationByToken(token);
  if (!registration) {
    return NextResponse.json({ error: "Invalid or expired setup link." }, { status: 404 });
  }

  return NextResponse.json({
    name: registration.name,
    email: registration.email,
    company_name: registration.company_name,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, password, name, website, logo_url, description } = body;

  if (!token || !password || !name?.trim()) {
    return NextResponse.json(
      { error: "Token, password, and company name are required." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const result = await completeOnboarding({
    token,
    password,
    organization: { name, website, logo_url, description },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: result.email, password });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, name, email, app_role, agent_status, onboarding_complete")
    .eq("id", result.userId)
    .single();

  if (profile) {
    await setSession(profileToSession(profile as ProfileRow));
  }

  return NextResponse.json({ ok: true });
}
