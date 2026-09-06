import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { rejectRegistrationRequest } from "@/lib/registration";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const result = await rejectRegistrationRequest(id, session.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
