import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUsers, stripPassword } from "@/lib/crm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await getUsers(session);
  return NextResponse.json({ users: users.map(stripPassword) });
}
