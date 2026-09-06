const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipients = Array.isArray(to) ? to : [to];

  if (!apiKey) {
    console.log("[email] RESEND_API_KEY not set — would send to:", recipients.join(", "));
    console.log("[email] Subject:", subject);
    console.log("[email] Body:", html.replace(/<[^>]+>/g, " ").trim());
    return false;
  }

  const from = process.env.EMAIL_FROM ?? "CRM <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: recipients, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Failed to send:", res.status, body);
    return false;
  }
  return true;
}

export async function sendOnboardingEmail(
  to: string,
  name: string,
  token: string
): Promise<boolean> {
  const link = `${APP_URL}/onboarding?token=${token}`;
  const sent = await sendEmail({
    to,
    subject: "Your Visa CRM account has been approved",
    html: `
      <p>Hi ${name},</p>
      <p>Your registration for Visa CRM has been approved. Click the link below to set up your company profile and password:</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in 7 days.</p>
    `,
  });

  if (!sent) {
    console.log("[email] Onboarding link for", to, ":", link);
  }
  return sent;
}

export async function sendSuperAdminRegistrationAlert(input: {
  to: string[];
  name: string;
  email: string;
  company_name: string;
  phone?: string;
}): Promise<void> {
  if (input.to.length === 0) {
    console.log(
      "[email] No super admin emails configured — new registration from",
      input.email,
      `(${input.company_name})`
    );
    return;
  }

  const reviewLink = `${APP_URL}/super-admin/requests`;
  await sendEmail({
    to: input.to,
    subject: `New agency registration: ${input.company_name}`,
    html: `
      <p>A new agency has requested access to Visa CRM.</p>
      <ul>
        <li><strong>Name:</strong> ${input.name}</li>
        <li><strong>Email:</strong> ${input.email}</li>
        <li><strong>Company:</strong> ${input.company_name}</li>
        <li><strong>Phone:</strong> ${input.phone || "—"}</li>
      </ul>
      <p><a href="${reviewLink}">Review in Super Admin Dashboard</a></p>
    `,
  });
}

export function buildOnboardingLink(token: string): string {
  return `${APP_URL}/onboarding?token=${token}`;
}

export async function sendAgentWelcomeEmail(input: {
  to: string;
  name: string;
  agencyName: string;
  agencyWebsite?: string;
  email: string;
  password: string;
}): Promise<boolean> {
  const loginUrl = `${APP_URL}/login`;
  const websiteLine = input.agencyWebsite
    ? `<p><strong>Agency website:</strong> <a href="${input.agencyWebsite}">${input.agencyWebsite}</a></p>`
    : "";

  const sent = await sendEmail({
    to: input.to,
    subject: `You've been added to ${input.agencyName} on Visa CRM`,
    html: `
      <p>Hi ${input.name},</p>
      <p>You have been added as an agent at <strong>${input.agencyName}</strong>.</p>
      ${websiteLine}
      <p>Use the credentials below to sign in:</p>
      <ul>
        <li><strong>Login page:</strong> <a href="${loginUrl}">${loginUrl}</a></li>
        <li><strong>Email:</strong> ${input.email}</li>
        <li><strong>Password:</strong> ${input.password}</li>
      </ul>
      <p>We recommend changing your password after your first login.</p>
    `,
  });

  if (!sent) {
    console.log("[email] Agent welcome — login:", loginUrl, "| email:", input.email);
  }
  return sent;
}
