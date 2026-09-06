import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { listAgencies } from "@/lib/agency-store";

export async function GET() {
  const session = await requireSession();
  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const agencies = await listAgencies();
    return NextResponse.json({ agencies });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load agencies";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
