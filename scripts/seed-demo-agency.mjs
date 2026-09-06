/**
 * Seeds a fully onboarded demo agency in Supabase.
 * Run: node scripts/seed-demo-agency.mjs
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = join(ROOT, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO = {
  organization: {
    name: "Demo Visa Agency",
    website: "https://demovisa.example.com",
    logo_url: "",
    description: "Seeded demo agency for local testing",
  },
  admin: {
    name: "Demo Admin",
    email: "admin@demoagency.com",
    phone: "+919800000100",
    password: "DemoAdmin123!",
  },
  agents: [
    {
      name: "Priya Agent",
      email: "priya.agent@demoagency.com",
      phone: "+919876543211",
      password: "DemoAgent123!",
      agent_status: "active",
    },
    {
      name: "Rahul Agent",
      email: "rahul.agent@demoagency.com",
      phone: "+919876543212",
      password: "DemoAgent123!",
      agent_status: "inactive",
    },
  ],
};

async function findUserIdByEmail(email) {
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (profile?.id) return profile.id;

  let page = 1;
  while (page <= 10) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (!data?.users?.length) break;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) break;
    page++;
  }
  return null;
}

async function ensureAuthUser({ email, password, name }) {
  const existingId = await findUserIdByEmail(email);
  if (existingId) {
    await admin.auth.admin.updateUserById(existingId, { password, email_confirm: true });
    return existingId;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create auth user ${email}: ${error?.message}`);
  }
  return data.user.id;
}

async function ensureProfile({ id, organization_id, name, email, phone, app_role, agent_status, onboarding_complete }) {
  const { data: existing } = await admin.from("profiles").select("id").eq("id", id).maybeSingle();
  const row = {
    id,
    organization_id,
    name,
    email: email.toLowerCase(),
    phone: phone ?? "",
    app_role,
    agent_status: app_role === "agent" ? agent_status ?? "active" : null,
    onboarding_complete,
  };

  if (existing) {
    const { error } = await admin.from("profiles").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("profiles").insert(row);
    if (error) throw new Error(error.message);
  }
}

async function main() {
  console.log("Seeding demo agency...\n");

  let orgId;
  const { data: existingOrg } = await admin
    .from("organizations")
    .select("id")
    .eq("name", DEMO.organization.name)
    .maybeSingle();

  if (existingOrg) {
    orgId = existingOrg.id;
    await admin.from("organizations").update(DEMO.organization).eq("id", orgId);
    console.log("Updated existing organization:", DEMO.organization.name);
  } else {
    const { data: org, error } = await admin
      .from("organizations")
      .insert(DEMO.organization)
      .select("id")
      .single();
    if (error || !org) throw new Error(error?.message ?? "Failed to create organization");
    orgId = org.id;
    console.log("Created organization:", DEMO.organization.name);
  }

  const adminId = await ensureAuthUser(DEMO.admin);
  await ensureProfile({
    id: adminId,
    organization_id: orgId,
    name: DEMO.admin.name,
    email: DEMO.admin.email,
    phone: DEMO.admin.phone,
    app_role: "admin",
    onboarding_complete: true,
  });
  console.log("Admin ready:", DEMO.admin.email);

  for (const agent of DEMO.agents) {
    const agentId = await ensureAuthUser(agent);
    await ensureProfile({
      id: agentId,
      organization_id: orgId,
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      app_role: "agent",
      agent_status: agent.agent_status,
      onboarding_complete: true,
    });
    console.log("Agent ready:", agent.email, `(${agent.agent_status})`);
  }

  console.log("\n--- Login credentials ---");
  console.log("Agency admin");
  console.log("  Email:   ", DEMO.admin.email);
  console.log("  Password:", DEMO.admin.password);
  console.log("\nActive agent");
  console.log("  Email:   ", DEMO.agents[0].email);
  console.log("  Password:", DEMO.agents[0].password);
  console.log("\nInactive agent (blocked at login)");
  console.log("  Email:   ", DEMO.agents[1].email);
  console.log("  Password:", DEMO.agents[1].password);
  console.log("\nLogin at: http://localhost:3000/login");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
