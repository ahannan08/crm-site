import {
  WHATSAPP_API_VERSION,
  isWhatsAppConfigured,
  normalizeWhatsAppPhone,
} from "./whatsapp-config";

export interface SendTemplateResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  dryRun?: boolean;
}

export async function sendWhatsAppTemplate(
  toPhone: string,
  templateName: string,
  bodyParams: string[]
): Promise<SendTemplateResult> {
  const to = normalizeWhatsAppPhone(toPhone);
  if (!to) {
    return { ok: false, error: `Invalid phone: ${toPhone}` };
  }

  if (!isWhatsAppConfigured()) {
    console.log("[WhatsApp dry-run]", { to, templateName, bodyParams });
    return { ok: true, dryRun: true, messageId: "dry-run" };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!.trim();
  const token = process.env.WHATSAPP_ACCESS_TOKEN!.trim();
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: bodyParams.map((text) => ({
              type: "text",
              text: text.slice(0, 1024),
            })),
          },
        ],
      },
    }),
  });

  const data = (await res.json()) as {
    messages?: { id: string }[];
    error?: { message: string };
  };

  if (!res.ok) {
    const msg = data.error?.message ?? res.statusText;
    console.error("[WhatsApp send failed]", { to, templateName, msg });
    return { ok: false, error: msg };
  }

  return { ok: true, messageId: data.messages?.[0]?.id };
}
