import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db";
import { setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (user.role === "agent" && user.agent_status === "inactive") {
    return NextResponse.json({ error: "Your account is inactive. Contact admin." }, { status: 403 });
  }

  await setSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
