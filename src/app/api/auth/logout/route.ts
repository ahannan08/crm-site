import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";
import { isMockSession } from "@/lib/mock-auth";
import { isSupabaseConfigured } from "@/lib/registration";

export async function POST() {
  const session = await getSession();
  if (session && !isMockSession(session) && isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}
