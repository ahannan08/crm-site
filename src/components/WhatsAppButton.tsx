import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";

export default function WhatsAppButton({ phone }: { phone: string }) {
  return (
    <a
      href={whatsappUrl(phone)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
      title="Open WhatsApp"
    >
      <MessageCircle className="h-3.5 w-3.5" />
      WhatsApp
    </a>
  );
}
