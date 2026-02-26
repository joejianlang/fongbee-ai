import { EmailTemplateType } from '@prisma/client';

interface EmailPayload {
  to: string;
  subject: string;
  htmlContent: string;
}

/**
 * Send email using SendGrid
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  SENDGRID_API_KEY not configured, skipping email send');
    return;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: payload.to }],
          },
        ],
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@youfujia.ca',
          name: '优服佳 Youfujia',
        },
        subject: payload.subject,
        content: [
          {
            type: 'text/html',
            value: payload.htmlContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid error: ${response.status} - ${error}`);
    }

    console.log(`✅ Email sent to ${payload.to}`);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}

/**
 * Replace template variables with actual values
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, String(value));
  }
  return rendered;
}

/**
 * Send templated email
 */
export async function sendTemplatedEmail(
  to: string,
  templateSubject: string,
  templateHtmlContent: string,
  variables: Record<string, string | number>
): Promise<void> {
  const subject = renderTemplate(templateSubject, variables);
  const htmlContent = renderTemplate(templateHtmlContent, variables);

  await sendEmail({
    to,
    subject,
    htmlContent,
  });
}
