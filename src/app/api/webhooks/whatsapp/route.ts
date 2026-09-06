import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim();
  if (mode === "subscribe" && token && verifyToken && token === verifyToken && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Log delivery status / inbound messages for future activity log integration
    console.log("[WhatsApp webhook]", JSON.stringify(body));
  } catch {
    // Meta expects 200 even on parse issues to avoid retries storm during setup
  }

  return Response.json({ ok: true });
}
