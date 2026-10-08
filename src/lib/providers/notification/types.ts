export type NotificationChannel = 'email' | 'whatsapp';

export type NotificationTemplate =
  | 'otp_verification'
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'pack_invoice';

export interface NotificationPayload {
  recipientUserId?: string;
  recipientEmail: string;
  recipientPhone?: string;
  template: NotificationTemplate;
  variables: Record<string, any>;
  allowWhatsAppFallbackToEmail?: boolean;
}

export interface NotificationResult {
  success: boolean;
  channelUsed: NotificationChannel;
  messageId?: string;
  error?: string;
  fallbackTriggered?: boolean;
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<NotificationResult>;
}
