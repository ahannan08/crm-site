import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getSuperAdminDashboard } from "@/lib/registration";

export async function GET() {
  const session = await requireSession();
  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await getSuperAdminDashboard();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load dashboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
