import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getAgencyDetail } from "@/lib/agency-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const agency = await getAgencyDetail(id);
    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }
    return NextResponse.json({ agency });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load agency";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
