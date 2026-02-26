/**
 * Send SMS using Twilio
 */
export async function sendSMS(to: string, message: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('⚠️  Twilio credentials not configured, skipping SMS send');
    return;
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: to,
          Body: message,
        }).toString(),
      }
    );

    if (!response.ok) {
      const error = (await response.json()) as any;
      throw new Error(`Twilio error: ${error?.message || response.statusText}`);
    }

    const data = (await response.json()) as any;
    console.log(`✅ SMS sent to ${to} (SID: ${data?.sid})`);
  } catch (error) {
    console.error('❌ Failed to send SMS:', error);
    throw error;
  }
}

/**
 * Replace template variables with actual values
 */
export function renderSMSTemplate(
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
 * Send templated SMS
 */
export async function sendTemplatedSMS(
  to: string,
  templateContent: string,
  variables: Record<string, string | number>
): Promise<void> {
  const message = renderSMSTemplate(templateContent, variables);
  await sendSMS(to, message);
}
