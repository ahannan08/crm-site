import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createActivity, getLeadById, getUserById } from "@/lib/crm";
import type { ActivityType } from "@/lib/types";

export async function POST(
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

  const { type, description } = await request.json();
  const activity = await createActivity(
    session,
    id,
    session.id,
    type as ActivityType,
    description
  );

  return NextResponse.json(
    {
      activity: {
        ...activity,
        user_name: (await getUserById(session, session.id))?.name ?? session.name,
      },
    },
    { status: 201 }
  );
}
