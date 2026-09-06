const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function sendOnboardingEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const link = `${APP_URL}/onboarding?token=${token}`;
  const subject = "Your Visa CRM account has been approved";
  const html = `
    <p>Hi ${name},</p>
    <p>Your registration for Visa CRM has been approved. Click the link below to set up your company profile and password:</p>
    <p><a href="${link}">${link}</a></p>
    <p>This link expires in 7 days.</p>
  `;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[email] RESEND_API_KEY not set — onboarding link for", to, ":", link);
    return;
  }

  const from = process.env.EMAIL_FROM ?? "noreply@visa-crm.local";
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
}
