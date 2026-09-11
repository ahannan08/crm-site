import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { transferLeads } from "@/lib/crm";
import type { TransferLeadType } from "@/lib/lead-utils";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { from_user_id, to_user_id, service_type, lead_type, reason } = body;

  if (!from_user_id || !to_user_id || !reason?.trim()) {
    return NextResponse.json(
      { error: "From user, to user, and reason are required" },
      { status: 400 }
    );
  }

  if (from_user_id === to_user_id) {
    return NextResponse.json(
      { error: "Source and destination users must be different" },
      { status: 400 }
    );
  }

  const validTypes: TransferLeadType[] = ["open", "registered", "open_registered", "all"];
  const type = validTypes.includes(lead_type) ? lead_type : "open_registered";

  try {
    const transferred = await transferLeads(session, {
      from_user_id,
      to_user_id,
      service_type: service_type?.trim() || undefined,
      lead_type: type,
      reason: reason.trim(),
    });
    return NextResponse.json({ transferred });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transfer failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
