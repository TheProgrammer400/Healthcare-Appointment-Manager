import { Resend } from 'resend';
import { EmailProvider, SendEmailOptions } from './emailProvider';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';

export class ResendProvider implements EmailProvider {
  async sendEmail(options: SendEmailOptions): Promise<{ id: string; success: boolean }> {
    if (!resend || !resendApiKey || resendApiKey.startsWith('re_mock')) {
      console.log(`[Mock Email Sent]: To: ${options.to} | Subject: ${options.subject}`);
      return { id: `mock-${Date.now()}`, success: true };
    }

    try {
      const data = await resend.emails.send({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (data.error) {
        throw new Error(data.error.message);
      }

      return { id: data.data?.id || `resend-${Date.now()}`, success: true };
    } catch (err: any) {
      console.error('[ResendProvider Error]:', err?.message || err);
      throw err;
    }
  }
}
