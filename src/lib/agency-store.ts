import { createAdminClient } from "./supabase/admin";
import type { AgencyDetail, AgencyMember, AgencySummary } from "./agencies";

function toMember(row: {
  id: string;
  name: string;
  email: string;
  phone: string;
  app_role: string;
  agent_status: string | null;
  joined_at: string;
}): AgencyMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    app_role: row.app_role as AgencyMember["app_role"],
    agent_status: row.agent_status as AgencyMember["agent_status"],
    joined_at: row.joined_at,
  };
}

export async function listAgencies(): Promise<AgencySummary[]> {
  const admin = createAdminClient();

  const { data: orgs, error: orgError } = await admin
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  if (orgError) throw new Error(orgError.message);
  if (!orgs?.length) return [];

  const orgIds = orgs.map((o) => o.id);
  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, organization_id, name, email, phone, app_role, agent_status, joined_at")
    .in("organization_id", orgIds);

  if (profileError) throw new Error(profileError.message);

  return orgs.map((org) => {
    const members = (profiles ?? []).filter((p) => p.organization_id === org.id);
    const adminProfile = members.find((p) => p.app_role === "admin");
    const agents = members.filter((p) => p.app_role === "agent");

    return {
      id: org.id,
      name: org.name,
      website: org.website,
      description: org.description,
      created_at: org.created_at,
      admin_name: adminProfile?.name ?? "—",
      admin_email: adminProfile?.email ?? "—",
      agent_count: agents.length,
    };
  });
}

export async function getAgencyDetail(id: string): Promise<AgencyDetail | null> {
  const admin = createAdminClient();

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (orgError) throw new Error(orgError.message);
  if (!org) return null;

  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, name, email, phone, app_role, agent_status, joined_at")
    .eq("organization_id", id)
    .order("joined_at", { ascending: true });

  if (profileError) throw new Error(profileError.message);

  const adminProfile = profiles?.find((p) => p.app_role === "admin") ?? null;
  const agents = (profiles ?? []).filter((p) => p.app_role === "agent");

  return {
    id: org.id,
    name: org.name,
    website: org.website,
    description: org.description,
    created_at: org.created_at,
    admin_name: adminProfile?.name ?? "—",
    admin_email: adminProfile?.email ?? "—",
    agent_count: agents.length,
    admin: adminProfile ? toMember(adminProfile) : null,
    agents: agents.map(toMember),
  };
}

export async function countAgencies(): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("organizations")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}
