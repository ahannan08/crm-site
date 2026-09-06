import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { listRegistrationRequests } from "@/lib/registration";

export async function GET() {
  const session = await requireSession();
  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requests = await listRegistrationRequests("pending");
  return NextResponse.json({ requests });
}
