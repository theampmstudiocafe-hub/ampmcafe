import { NotificationPayload, NotificationResult } from "./types";

export class WhatsAppChannel {
  private apiToken: string | undefined;
  private phoneNumberId: string | undefined;

  constructor() {
    this.apiToken = process.env.WHATSAPP_API_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  }

  public async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!payload.recipientPhone) {
      return {
        success: false,
        channelUsed: "whatsapp",
        error: "No phone number provided for WhatsApp delivery",
      };
    }

    // Clean phone number (strip whitespace, dashes)
    const cleanPhone = payload.recipientPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return {
        success: false,
        channelUsed: "whatsapp",
        error: "Invalid phone number format",
      };
    }

    // Standardize to India E.164 without leading plus
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // If Meta credentials are not configured, simulate in dev mode
    if (!this.apiToken || !this.phoneNumberId) {
      console.log(`[WhatsApp DEV SIMULATION] To: +${formattedPhone} | Template: ${payload.template}`);
      console.log(`[WhatsApp DEV VARIABLES]`, payload.variables);
      return {
        success: true,
        channelUsed: "whatsapp",
        messageId: `wamid.dev-${Date.now()}`,
      };
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "template",
          template: {
            name: payload.template,
            language: { code: "en_US" },
            components: [
              {
                type: "body",
                parameters: Object.entries(payload.variables).map(([_, val]) => ({
                  type: "text",
                  text: String(val),
                })),
              },
            ],
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "WhatsApp API error");
      }

      const messageId = data.messages?.[0]?.id || `wamid.${Date.now()}`;
      return {
        success: true,
        channelUsed: "whatsapp",
        messageId,
      };
    } catch (err: any) {
      console.error("[WhatsAppChannel Error]", err);
      return {
        success: false,
        channelUsed: "whatsapp",
        error: err?.message || "Meta Cloud API delivery failed",
      };
    }
  }
}
