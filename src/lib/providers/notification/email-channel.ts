import nodemailer from "nodemailer";
import { NotificationPayload, NotificationResult } from "./types";

export class EmailChannel {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === "true",
        auth: { user, pass },
      });
      this.isConfigured = true;
    }
  }

  public async send(payload: NotificationPayload): Promise<NotificationResult> {
    const fromAddress = process.env.SMTP_FROM_EMAIL || "hello@theampmstudio.com";
    const fromName = process.env.SMTP_FROM_NAME || "THE AM:PM STUDIO Pune";
    const { subject, html, text } = this.renderTemplate(payload);

    if (!this.isConfigured || !this.transporter) {
      console.log(`[SMTP DEV SIMULATION] To: ${payload.recipientEmail} | Subject: ${subject}`);
      console.log(`[SMTP DEV BODY] ${text || html.slice(0, 120)}...`);
      return {
        success: true,
        channelUsed: "email",
        messageId: `dev-sim-${Date.now()}`,
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: payload.recipientEmail,
        subject,
        html,
        text,
      });

      return {
        success: true,
        channelUsed: "email",
        messageId: info.messageId,
      };
    } catch (err: any) {
      console.error("[EmailChannel Error]", err);
      return {
        success: false,
        channelUsed: "email",
        error: err?.message || "Failed to send email via SMTP",
      };
    }
  }

  private renderTemplate(payload: NotificationPayload): { subject: string; html: string; text: string } {
    const { template, variables } = payload;
    const brandName = "THE AM:PM STUDIO";
    const location = "Lane 6, Koregaon Park, Pune";

    switch (template) {
      case "otp_verification": {
        const otp = variables.otp || "000000";
        const purpose = variables.purpose === "recovery" ? "Password Reset" : "Account Verification";
        const subject = `${otp} is your ${purpose} code - ${brandName}`;
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #FAF7F2; padding: 36px; border-radius: 12px; border: 1px solid #EAE3D6;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #C86D51; font-size: 22px; font-weight: 600; margin: 0 0 6px 0;">${brandName}</h1>
              <p style="color: #657E6B; font-size: 13px; margin: 0;">${location}</p>
            </div>
            <div style="background: #FFFFFF; padding: 28px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); text-align: center;">
              <h2 style="font-size: 18px; color: #1E2421; margin: 0 0 12px 0;">Your One-Time Password</h2>
              <p style="font-size: 14px; color: #555555; margin: 0 0 20px 0;">Use the 6-digit code below to complete your ${purpose.toLowerCase()}. Valid for 10 minutes.</p>
              <div style="background: #F7ECE8; border: 1px dashed #C86D51; border-radius: 8px; padding: 16px; margin: 0 auto 20px auto; max-width: 240px;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #C86D51;">${otp}</span>
              </div>
              <p style="font-size: 12px; color: #888888; margin: 0;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
            <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #888888;">
              <p style="margin: 0;">Warmly,<br>The AM:PM Studio Team</p>
            </div>
          </div>
        `;
        return { subject, html, text: `Your ${purpose} code is ${otp}. Valid for 10 minutes.` };
      }

      case "booking_confirmed": {
        const className = variables.className || "Yoga Session";
        const trainerName = variables.trainerName || "Instructor";
        const sessionTime = variables.sessionTime || "Upcoming";
        const room = variables.room || "Main Shala";
        const subject = `Confirmed: Your spot in ${className} is booked!`;
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; background: #FAF7F2; padding: 36px; border-radius: 12px; border: 1px solid #EAE3D6;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #C86D51; font-size: 22px; font-weight: 600; margin: 0 0 6px 0;">${brandName}</h1>
              <p style="color: #657E6B; font-size: 13px; margin: 0;">${location}</p>
            </div>
            <div style="background: #FFFFFF; padding: 28px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
              <h2 style="font-size: 18px; color: #1E2421; margin: 0 0 16px 0; text-align: center;">Session Confirmed 🙏</h2>
              <div style="background: #EFF4F0; border-left: 4px solid #657E6B; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0 0 6px 0; font-size: 16px; font-weight: 600; color: #1E2421;">${className}</p>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #444;">Teacher: <strong>${trainerName}</strong></p>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #444;">When: <strong>${sessionTime}</strong></p>
                <p style="margin: 0; font-size: 14px; color: #444;">Location: <strong>${room} (${location})</strong></p>
              </div>
              <p style="font-size: 13px; color: #555; line-height: 1.5; margin: 0 0 12px 0;">
                Please arrive 10-15 minutes early to settle into your mat. Mats and props are provided. You are warmly invited to visit our café after practice for herbal infusions and nourishment.
              </p>
              <p style="font-size: 12px; color: #888; margin: 0;">
                Need to cancel? You can cancel up to 12 hours prior in your member dashboard for a full credit refund.
              </p>
            </div>
          </div>
        `;
        return { subject, html, text: `Your spot in ${className} with ${trainerName} on ${sessionTime} is confirmed at ${room}.` };
      }

      default: {
        const subject = `${brandName} Notification`;
        const text = JSON.stringify(variables, null, 2);
        const html = `<p>${text}</p>`;
        return { subject, html, text };
      }
    }
  }
}
