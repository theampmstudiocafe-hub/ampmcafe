import { EmailChannel } from "./email-channel";
import { WhatsAppChannel } from "./whatsapp-channel";
import { NotificationPayload, NotificationProvider, NotificationResult } from "./types";

export class UnifiedNotificationService implements NotificationProvider {
  private emailChannel: EmailChannel;
  private whatsappChannel: WhatsAppChannel;

  constructor() {
    this.emailChannel = new EmailChannel();
    this.whatsappChannel = new WhatsAppChannel();
  }

  public async send(payload: NotificationPayload): Promise<NotificationResult> {
    const shouldTryWhatsApp =
      Boolean(payload.recipientPhone) &&
      payload.template !== "otp_verification" && // OTP is strictly email-based in Phase 1 auth
      payload.template !== "pack_invoice";

    if (shouldTryWhatsApp) {
      const waResult = await this.whatsappChannel.send(payload);

      if (waResult.success) {
        return waResult;
      }

      // If WhatsApp failed and fallback is allowed, fall back to email
      if (payload.allowWhatsAppFallbackToEmail !== false) {
        console.warn(`[NotificationService] WhatsApp failed (${waResult.error}). Executing automated Email fallback.`);
        const emailResult = await this.emailChannel.send(payload);
        return {
          ...emailResult,
          fallbackTriggered: true,
        };
      }

      return waResult;
    }

    // Default primary delivery: Custom SMTP Email
    return this.emailChannel.send(payload);
  }
}

// Singleton export
export const notificationService = new UnifiedNotificationService();
