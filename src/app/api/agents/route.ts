import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAgent } from "@/lib/db";
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
    const agent = createAgent({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim(),
      password: password.trim(),
      agent_status: (agent_status as AgentStatus) || "active",
    });
    const { password: _, ...safe } = agent;
    return NextResponse.json({ agent: safe }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create agent";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
