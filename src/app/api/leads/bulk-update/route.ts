import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { bulkUpdateLeads } from "@/lib/crm";
import type { LeadDisposition, LeadSource, LeadStatus } from "@/lib/types";

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { lead_ids, disposition, status, assigned_to, source } = body;

  if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
    return NextResponse.json({ error: "Select at least one lead" }, { status: 400 });
  }

  const hasUpdate =
    disposition !== undefined ||
    status !== undefined ||
    assigned_to !== undefined ||
    source !== undefined;

  if (!hasUpdate) {
    return NextResponse.json({ error: "Choose at least one field to update" }, { status: 400 });
  }

  try {
    const updated = await bulkUpdateLeads(session, {
      lead_ids,
      disposition: disposition as LeadDisposition | undefined,
      status: status as LeadStatus | undefined,
      assigned_to: assigned_to === "" ? null : assigned_to,
      source: source as LeadSource | undefined,
    });
    return NextResponse.json({ updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bulk update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
