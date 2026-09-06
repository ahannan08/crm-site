import { randomUUID } from "crypto";
import { createAdminClient, isSupabaseAdminConfigured } from "./supabase/admin";
import { sendOnboardingEmail, sendSuperAdminRegistrationAlert, buildOnboardingLink } from "./email";
import type { RegistrationRequest, RegistrationStatus } from "./types";
import { countAgencies } from "./agency-store";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function createRegistrationRequest(input: {
  name: string;
  email: string;
  company_name: string;
  phone?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Registration is not available yet. Use demo accounts to explore." };
  }

  const admin = createAdminClient();
  const email = input.email.trim().toLowerCase();

  const { data: existingPending } = await admin
    .from("registration_requests")
    .select("id")
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (existingPending) {
    return { ok: false, error: "A pending registration already exists for this email." };
  }

  const existingUserId = await findAuthUserIdByEmail(admin, email);
  if (existingUserId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("onboarding_complete, app_role")
      .eq("id", existingUserId)
      .maybeSingle();

    if (profile?.onboarding_complete) {
      return { ok: false, error: "An account with this email already exists." };
    }
  }

  const { error } = await admin.from("registration_requests").insert({
    name: input.name.trim(),
    email,
    company_name: input.company_name.trim(),
    phone: input.phone?.trim() ?? "",
    status: "pending" as RegistrationStatus,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const superAdminEmails = await getSuperAdminEmails();
  await sendSuperAdminRegistrationAlert({
    to: superAdminEmails,
    name: input.name.trim(),
    email,
    company_name: input.company_name.trim(),
    phone: input.phone?.trim(),
  });

  return { ok: true };
}

async function getSuperAdminEmails(): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("email")
    .eq("app_role", "super_admin");

  const emails = new Set<string>();
  for (const row of data ?? []) {
    if (row.email) emails.add(row.email);
  }
  if (process.env.SUPER_ADMIN_NOTIFY_EMAIL) {
    emails.add(process.env.SUPER_ADMIN_NOTIFY_EMAIL.trim());
  }
  return [...emails];
}

export interface SuperAdminDashboardData {
  metrics: {
    pending: number;
    approved: number;
    rejected: number;
    totalAgencies: number;
  };
  requests: RegistrationRequest[];
}

export async function getSuperAdminDashboard(): Promise<SuperAdminDashboardData> {
  const admin = createAdminClient();
  const [requests, totalAgencies] = await Promise.all([
    listRegistrationRequests(),
    countAgencies(),
  ]);

  const pending = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  return {
    metrics: {
      pending,
      approved,
      rejected,
      totalAgencies,
    },
    requests,
  };
}

export async function listRegistrationRequests(
  status?: RegistrationStatus
): Promise<RegistrationRequest[]> {
  const admin = createAdminClient();
  let query = admin
    .from("registration_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistrationRequest[];
}

async function findAuthUserIdByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  if (profile?.id) return profile.id;

  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data.users.length) break;

    const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (match) return match.id;

    if (data.users.length < 200) break;
    page++;
  }

  return null;
}

async function finalizeApproval(
  admin: ReturnType<typeof createAdminClient>,
  request: RegistrationRequest,
  requestId: string,
  reviewerId: string,
  userId: string
): Promise<{ ok: true; onboardingLink: string; emailSent: boolean } | { ok: false; error: string }> {
  const setupToken = randomUUID();
  const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  const { error: updateError } = await admin
    .from("registration_requests")
    .update({
      status: "approved",
      setup_token: setupToken,
      token_expires_at: tokenExpiresAt,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq("id", requestId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  const emailSent = await sendOnboardingEmail(request.email, request.name, setupToken);
  return {
    ok: true,
    onboardingLink: buildOnboardingLink(setupToken),
    emailSent,
  };
}

export async function approveRegistrationRequest(
  requestId: string,
  reviewerId: string
): Promise<
  { ok: true; onboardingLink: string; emailSent: boolean } | { ok: false; error: string }
> {
  const admin = createAdminClient();

  const { data: request, error: fetchError } = await admin
    .from("registration_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "pending")
    .single();

  if (fetchError || !request) {
    return { ok: false, error: "Request not found or already reviewed." };
  }

  const existingUserId = await findAuthUserIdByEmail(admin, request.email);

  if (existingUserId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, onboarding_complete")
      .eq("id", existingUserId)
      .maybeSingle();

    if (profile?.onboarding_complete) {
      return { ok: false, error: "This agency has already completed onboarding." };
    }

    if (!profile) {
      const { error: profileError } = await admin.from("profiles").insert({
        id: existingUserId,
        name: request.name,
        email: request.email,
        phone: request.phone ?? "",
        app_role: "admin",
        onboarding_complete: false,
      });

      if (profileError) {
        return { ok: false, error: profileError.message };
      }
    }

    return finalizeApproval(admin, request as RegistrationRequest, requestId, reviewerId, existingUserId);
  }

  const tempPassword = randomUUID();
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: request.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name: request.name },
  });

  if (authError || !authUser.user) {
    return { ok: false, error: authError?.message ?? "Failed to create user." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authUser.user.id,
    name: request.name,
    email: request.email,
    phone: request.phone ?? "",
    app_role: "admin",
    onboarding_complete: false,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { ok: false, error: profileError.message };
  }

  return finalizeApproval(admin, request as RegistrationRequest, requestId, reviewerId, authUser.user.id);
}

export async function resendSetupLink(
  requestId: string,
  reviewerId: string
): Promise<
  { ok: true; onboardingLink: string; emailSent: boolean } | { ok: false; error: string }
> {
  const admin = createAdminClient();

  const { data: request, error: fetchError } = await admin
    .from("registration_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "approved")
    .single();

  if (fetchError || !request) {
    return { ok: false, error: "Approved request not found." };
  }

  const userId = await findAuthUserIdByEmail(admin, request.email);
  if (!userId) {
    return { ok: false, error: "User account not found for this registration." };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", userId)
    .single();

  if (profile?.onboarding_complete) {
    return { ok: false, error: "This agency has already completed onboarding." };
  }

  return finalizeApproval(admin, request as RegistrationRequest, requestId, reviewerId, userId);
}

export async function rejectRegistrationRequest(
  requestId: string,
  reviewerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("registration_requests")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function getRegistrationByToken(
  token: string
): Promise<RegistrationRequest | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("registration_requests")
    .select("*")
    .eq("setup_token", token)
    .eq("status", "approved")
    .maybeSingle();

  if (error || !data) return null;

  if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) {
    return null;
  }

  return data as RegistrationRequest;
}

export async function completeOnboarding(input: {
  token: string;
  password: string;
  organization: {
    name: string;
    website?: string;
    logo_url?: string;
    description?: string;
  };
}): Promise<{ ok: true; userId: string; email: string } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const request = await getRegistrationByToken(input.token);

  if (!request) {
    return { ok: false, error: "Invalid or expired setup link." };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", request.email)
    .single();

  if (profileError || !profile) {
    return { ok: false, error: "User profile not found." };
  }

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: input.organization.name.trim(),
      website: input.organization.website?.trim() ?? "",
      logo_url: input.organization.logo_url?.trim() ?? "",
      description: input.organization.description?.trim() ?? "",
    })
    .select("id")
    .single();

  if (orgError || !org) {
    return { ok: false, error: orgError?.message ?? "Failed to create organization." };
  }

  const { error: updateProfileError } = await admin
    .from("profiles")
    .update({
      organization_id: org.id,
      onboarding_complete: true,
    })
    .eq("id", profile.id);

  if (updateProfileError) {
    return { ok: false, error: updateProfileError.message };
  }

  const { error: passwordError } = await admin.auth.admin.updateUserById(profile.id, {
    password: input.password,
  });

  if (passwordError) {
    return { ok: false, error: passwordError.message };
  }

  await admin
    .from("registration_requests")
    .update({ setup_token: null, token_expires_at: null })
    .eq("id", request.id);

  return { ok: true, userId: profile.id, email: request.email };
}
