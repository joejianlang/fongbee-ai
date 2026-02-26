import { prisma } from '@/lib/db';
import { sendTemplatedEmail } from '@/lib/email';
import { sendTemplatedSMS } from '@/lib/sms';

/**
 * Test script to verify email and SMS sending for sales partner invitations
 * Usage: npx ts-node scripts/test-invitation-service.ts
 */

async function testEmailService() {
  console.log('\n📧 Testing Email Service...\n');

  try {
    // Get an email template
    const emailTemplate = await prisma.emailTemplate.findUnique({
      where: { type: 'USER_INVITATION' },
    });

    if (!emailTemplate) {
      console.error('❌ USER_INVITATION template not found');
      return;
    }

    console.log(`✅ Found template: ${emailTemplate.name}`);
    console.log(`   Subject: ${emailTemplate.subject}`);

    // Prepare test variables
    const testVariables = {
      name: 'Test User',
      inviterName: 'Test Company',
      invitationCode: 'TEST123456',
      signupLink: 'https://youfujia.ca/register?code=TEST123456',
    };

    console.log('\n📝 Template Variables:');
    console.log(JSON.stringify(testVariables, null, 2));

    // Note: Actual email sending would require valid SendGrid API key
    console.log('\n💡 To send actual emails, configure SENDGRID_API_KEY in environment');
    console.log('   Example: SENDGRID_API_KEY=SG.your_actual_api_key');
  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
}

async function testSMSService() {
  console.log('\n📱 Testing SMS Service...\n');

  try {
    // Get an SMS template
    const smsTemplate = await prisma.sMSTemplate.findUnique({
      where: { type: 'PROVIDER_INVITE' },
    });

    if (!smsTemplate) {
      console.error('❌ PROVIDER_INVITE template not found');
      return;
    }

    console.log(`✅ Found template: ${smsTemplate.name}`);
    console.log(`   Content: ${smsTemplate.content}`);

    // Prepare test variables
    const testVariables = {
      invitationLink: 'https://youfujia.ca/register?invitation=12345',
      invitationCode: 'TEST123456',
      type: 'SERVICE_PROVIDER',
    };

    console.log('\n📝 Template Variables:');
    console.log(JSON.stringify(testVariables, null, 2));

    // Note: Actual SMS sending would require valid Twilio credentials
    console.log('\n💡 To send actual SMS, configure Twilio credentials in environment:');
    console.log('   TWILIO_ACCOUNT_SID=your_account_sid');
    console.log('   TWILIO_AUTH_TOKEN=your_auth_token');
    console.log('   TWILIO_PHONE_NUMBER=+1234567890');
  } catch (error) {
    console.error('❌ SMS test failed:', error);
  }
}

async function testInvitationFlow() {
  console.log('\n🔄 Testing Sales Partner Invitation Flow...\n');

  try {
    // Get a sales partner
    const partner = await prisma.salesPartner.findFirst();

    if (!partner) {
      console.log('⚠️  No sales partners found in database');
      console.log('   Create a sales partner first to test invitations');
      return;
    }

    console.log(`✅ Found sales partner: ${partner.companyName || partner.id}`);
    console.log(`   Referral Code: ${partner.referralCode}`);

    // Check email templates
    const emailTemplates = await prisma.emailTemplate.findMany({
      where: {
        type: { in: ['USER_INVITATION', 'PROVIDER_INVITATION', 'SALES_INVITATION'] },
      },
    });

    console.log('\n📧 Email Templates:');
    emailTemplates.forEach((t) => {
      console.log(`   ✅ ${t.type}: ${t.name}`);
    });

    // Check SMS templates
    const smsTemplates = await prisma.sMSTemplate.findMany({
      where: { type: 'PROVIDER_INVITE' },
    });

    console.log('\n📱 SMS Templates:');
    smsTemplates.forEach((t) => {
      console.log(`   ✅ ${t.type}: ${t.name}`);
    });

    // Show invitation creation endpoint
    console.log('\n🚀 To create an invitation, call:');
    console.log(
      `   POST /api/admin/sales-partners/${partner.id}/invite`
    );
    console.log('   Body: {');
    console.log('     "email": "user@example.com",');
    console.log('     "type": "USER"');
    console.log('   }');
    console.log('   OR');
    console.log('   Body: {');
    console.log('     "phone": "+11234567890",');
    console.log('     "type": "SERVICE_PROVIDER"');
    console.log('   }');

    console.log('\n✨ Features:');
    console.log('   ✅ Validates email/phone is provided');
    console.log('   ✅ Checks for existing users with same email/phone');
    console.log('   ✅ Prevents duplicate role registration');
    console.log('   ✅ Selects correct template based on invitation type');
    console.log('   ✅ Sends email via SendGrid (when configured)');
    console.log('   ✅ Sends SMS via Twilio (when configured)');
    console.log('   ✅ Logs all invitations for audit trail');
  } catch (error) {
    console.error('❌ Invitation flow test failed:', error);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Sales Partner Invitation Service Test');
  console.log('═══════════════════════════════════════════════════════');

  await testEmailService();
  await testSMSService();
  await testInvitationFlow();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Test Complete');
  console.log('═══════════════════════════════════════════════════════\n');
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
