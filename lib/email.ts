import { Resend } from 'resend';

interface EmailPayload {
  to: string;
  subject: string;
  htmlContent: string;
}

// Lazily instantiate so missing key just logs a warning at call time
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Send email using Resend
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  RESEND_API_KEY not configured, skipping email send');
    return;
  }

  const from =
    process.env.RESEND_FROM_EMAIL ||
    'onboarding@resend.dev'; // Resend sandbox default (sends to account email only)

  const { error } = await getResend().emails.send({
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.htmlContent,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log(`✅ Email sent to ${payload.to}`);
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
