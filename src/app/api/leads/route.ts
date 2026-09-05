import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createLead, getLeads, getUsers } from "@/lib/db";
import type { LeadSource, LeadStatus, VisaType } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const filters = {
    visa_type: (params.get("visa_type") as VisaType) || undefined,
    source: (params.get("source") as LeadSource) || undefined,
    status: (params.get("status") as LeadStatus) || undefined,
    assigned_to: params.get("assigned_to") || undefined,
    search: params.get("search") || undefined,
    mine: session.role === "agent" ? session.id : undefined,
  };

  const leads = getLeads(filters);
  const users = getUsers().map(({ password: _, ...u }) => u);

  return NextResponse.json({ leads, users });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const lead = createLead(body);
  return NextResponse.json({ lead }, { status: 201 });
}
