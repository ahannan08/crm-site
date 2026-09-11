import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createLead, getLeads, getUsers, stripPassword } from "@/lib/crm";
import type { LeadDisposition, LeadSource, LeadStatus, VisaType } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const periodParam = params.get("period");
  const period: "week" | "month" | undefined =
    periodParam === "week" || periodParam === "month" ? periodParam : undefined;
  const filters = {
    visa_type: (params.get("visa_type") as VisaType) || undefined,
    source: (params.get("source") as LeadSource) || undefined,
    status: (params.get("status") as LeadStatus) || undefined,
    disposition: (params.get("disposition") as LeadDisposition) || undefined,
    assigned_to: params.get("assigned_to") || undefined,
    search: params.get("search") || undefined,
    period,
  };

  const [leads, users] = await Promise.all([
    getLeads(session, filters),
    getUsers(session),
  ]);

  return NextResponse.json({
    leads,
    users: users.map(stripPassword),
    role: session.role,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.name?.trim() || !body.phone?.trim() || !body.enquiry_date) {
    return NextResponse.json(
      { error: "Name, phone, and date are required" },
      { status: 400 }
    );
  }

  try {
    const lead = await createLead(session, body);
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create lead";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
