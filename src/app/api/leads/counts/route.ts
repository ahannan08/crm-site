import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLeadCountsForUser } from "@/lib/crm";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  const counts = await getLeadCountsForUser(session, userId);
  return NextResponse.json({ counts });
}
