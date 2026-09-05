import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUsers } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = getUsers().map(({ password: _, ...u }) => u);
  return NextResponse.json({ users });
}
