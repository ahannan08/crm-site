import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLeadById, updateLead, getActivities, getUserById } from "@/lib/crm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const lead = await getLeadById(session, id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  if (session.role === "agent" && lead.assigned_to !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const activities = await getActivities(session, id);
  const enriched = await Promise.all(
    activities.map(async (a) => ({
      ...a,
      user_name: (await getUserById(session, a.user_id))?.name ?? "Unknown",
    }))
  );

  return NextResponse.json({ lead, activities: enriched });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const lead = await getLeadById(session, id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  if (session.role === "agent" && lead.assigned_to !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updated = await updateLead(session, id, body);
  return NextResponse.json({ lead: updated });
}
