import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAgent, stripPassword } from "@/lib/crm";
import { isMockSession } from "@/lib/mock-auth";
import type { AgentStatus } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, phone, password, agent_status } = body;

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    );
  }

  try {
    const result = await createAgent(session, {
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim(),
      password: password.trim(),
      agent_status: (agent_status as AgentStatus) || "active",
    });
    return NextResponse.json(
      {
        agent: stripPassword(result.user),
        emailSent: result.emailSent,
        isMock: isMockSession(session),
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create agent";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
