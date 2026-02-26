# Sales Partner Invitation System - Integration Guide

## 🎯 Quick Start

The sales partner invitation system is now fully implemented with email and SMS integration. Here's how to get it running:

### 1. Configure Environment Variables

For **development** (`.env.local` is already configured):
```bash
# Already set with test keys in .env.local
SENDGRID_API_KEY="SG.test_key_local_only"
TWILIO_ACCOUNT_SID="AC_local_test"
TWILIO_AUTH_TOKEN="local_test_auth"
```

For **production**, update with real credentials:
```bash
# Get from sendgrid.com
SENDGRID_API_KEY="SG.your_real_api_key"
SENDGRID_FROM_EMAIL="support@youfujia.ca"

# Get from twilio.com
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"
```

### 2. Initialize Email Templates

Make sure email templates are initialized in the database:
```bash
# Run this once to create templates
npx ts-node scripts/init-email-templates.ts
```

Expected templates created:
- ✅ USER_INVITATION - For regular users
- ✅ PROVIDER_INVITATION - For service providers
- ✅ SALES_INVITATION - For sales partners

### 3. Test the System

```bash
# Verify system configuration and templates
npx ts-node scripts/test-invitation-service.ts
```

Output should show:
```
✅ Found template: 用户邀请注册 (USER_INVITATION)
✅ Found template: 服务商入驻邀请 (PROVIDER_INVITATION)
✅ Found template: 销售合伙人邀请 (SALES_INVITATION)
```

---

## 🚀 Using the System

### Admin Workflow

#### Step 1: Access Admin Dashboard
```
URL: http://localhost:3000/admin/users/sales-partners
```

#### Step 2: Select a Sales Partner
- Filter by tier (Bronze, Silver, Gold)
- View partner statistics
- Click "发送邀请" (Send Invitation)

#### Step 3: Create Invitation
- **Input:** Email or Phone number
- **Select:** Invitation type (User, Service Provider, Sales Partner)
- **Click:** "生成邀请链接" (Generate Invitation Link)

#### Step 4: Share Link
- Copy the generated invitation link
- Share via email, messaging, or other channels
- System will also auto-send email/SMS (if configured)

### API Usage

#### Create Invitation
```bash
POST /api/admin/sales-partners/{partnerId}/invite

# Body - Email Invitation
{
  "email": "newuser@example.com",
  "name": "John Doe",
  "type": "USER"
}

# Body - SMS Invitation
{
  "phone": "+11234567890",
  "type": "SERVICE_PROVIDER"
}

# Response
{
  "success": true,
  "data": {
    "invitationId": "clx123abc...",
    "invitationLink": "https://youfujia.ca/register/sales-partner?invitation=clx123abc&referral=SP12345ABC",
    "referralCode": "SP12345ABC...",
    "expiresAt": "2026-03-27T10:30:00.000Z",
    "target": "newuser@example.com",
    "type": "USER",
    "templateType": "USER_INVITATION"
  }
}
```

#### List Invitations
```bash
GET /api/admin/sales-partners/{partnerId}/invite?status=PENDING&type=USER&page=1&limit=20

# Response
{
  "success": true,
  "data": {
    "invitations": [
      {
        "id": "clx123...",
        "email": "user@example.com",
        "phone": null,
        "name": "User Name",
        "type": "USER",
        "status": "PENDING",
        "expiresAt": "2026-03-27T...",
        "acceptedAt": null,
        "createdAt": "2026-02-25T..."
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

#### Validate Invitation (Registration Page)
```bash
GET /api/sales-partners/invitations/{invitationId}/validate

# Response
{
  "success": true,
  "data": {
    "invitationId": "clx123...",
    "inviteeEmail": "user@example.com",
    "inviteeName": "User Name",
    "inviteeType": "USER",
    "expiresAt": "2026-03-27T...",
    "partner": {
      "id": "sp123...",
      "companyName": "Company Name",
      "tier": "GOLD",
      "referralCode": "SP12345..."
    }
  }
}
```

---

## 📧 Email Template Variables

### USER_INVITATION
**Subject:** `[优服佳] {{inviterName}} 邀请您加入优服佳`

**Available variables:**
- `name` - Recipient name
- `inviterName` - Sales partner company name
- `invitationCode` - Referral code
- `signupLink` - Registration link

**HTML includes:** Platform benefits, CTA button

### PROVIDER_INVITATION
**Subject:** `[优服佳] 邀请您加入我们的服务商平台`

**Available variables:**
- `name` - Recipient name
- `registerLink` - Registration link

**HTML includes:** Service provider benefits, CTA button

### SALES_INVITATION
**Subject:** `[优服佳] 邀请您成为销售合伙人`

**Available variables:**
- `name` - Recipient name
- `invitationLink` - Invitation link

**HTML includes:** Partnership benefits, CTA button

---

## 📱 SMS Integration

**Template:** PROVIDER_INVITE (used for all invitation types)

**Variables:**
- `invitationLink` - Full invitation URL
- `invitationCode` - Referral code
- `type` - Invitation type (USER, SERVICE_PROVIDER, SALES_PARTNER)

**Example messages:**
```
邀请链接: https://youfujia.ca/register/sales-partner?invitation=...
邀请码: SP12345ABC...
类型: USER
```

---

## ❌ Error Handling

### Email Send Failure
- ❌ Email fails to send
- ✅ Invitation is still created
- ✅ Invitation link is still generated
- ✅ Error is logged to console
- ✅ Admin can share link manually

```typescript
try {
  await sendTemplatedEmail(...)
} catch (error) {
  console.error('Email failed:', error)
  // Continue - invitation already created
}
```

### Validation Errors

**Missing contact:**
```json
{
  "success": false,
  "error": "邮箱和手机号至少填一个"
}
```

**Duplicate role:**
```json
{
  "success": false,
  "error": "用户已存在，无法重复注册用户角色。该用户邮箱: user@example.com"
}
```

**Partner not found:**
```json
{
  "success": false,
  "error": "销售合伙人不存在"
}
```

---

## 🔍 Monitoring & Debugging

### Check Invitation Status
```sql
-- View all invitations for a partner
SELECT * FROM "SalesPartnerInvitation"
WHERE "partnerId" = 'partner_id'
ORDER BY "createdAt" DESC;

-- View by status
SELECT * FROM "SalesPartnerInvitation"
WHERE status = 'PENDING' AND "expiresAt" > NOW();
```

### Check Audit Log
```sql
-- View all invitation operations
SELECT * FROM "AdminLog"
WHERE "resourceType" = 'SalesPartnerInvitation'
ORDER BY "createdAt" DESC;
```

### Console Logging
When invitations are created, you'll see console output:
```
📧 邮件邀请已发送到: user@example.com
📱 短信邀请已发送到: +11234567890
```

---

## 🚨 Troubleshooting

### Emails Not Sending

**Check 1: API Key Configuration**
```bash
# Verify key is set
echo $SENDGRID_API_KEY
# Should start with "SG."
```

**Check 2: Email Template Exists**
```bash
# List templates
npx ts-node scripts/test-invitation-service.ts
# Should show: ✅ USER_INVITATION, PROVIDER_INVITATION, SALES_INVITATION
```

**Check 3: Recipient Email Valid**
```bash
# Email should be properly formatted
# Should pass zod validation: z.string().email()
```

**Check 4: Console Logs**
```bash
# Look for error messages in server logs
# Should indicate SendGrid error response
```

### SMS Not Sending

**Check 1: Twilio Credentials**
```bash
echo "SID: $TWILIO_ACCOUNT_SID"
echo "Token: $TWILIO_AUTH_TOKEN"
echo "Number: $TWILIO_PHONE_NUMBER"
```

**Check 2: Phone Format**
- Should include country code: `+1`
- Should be valid E.164 format: `+11234567890`

**Check 3: SMS Template**
- Should exist: PROVIDER_INVITE
- Should have `content` field with template text

### Invitations Not Created

**Check 1: Partner Exists**
```bash
# Verify partner ID is valid
# Try getting partner first: GET /api/admin/sales-partners/{id}
```

**Check 2: Email/Phone Provided**
- Request must have either `email` or `phone`
- Cannot be empty string

**Check 3: Duplicate Prevention**
- Check if user already exists with that email/phone
- Check if user already has the same role
- Refer to error message for details

---

## 📚 Architecture Overview

```
Admin Dashboard
    ↓
Form Input (email/phone + type)
    ↓
POST /api/admin/sales-partners/[id]/invite
    ↓
Validation (contact, duplicates, partner exists)
    ↓
Create Invitation Record (PENDING, 30-day expiry)
    ↓
Generate Unique Link
    ↓
┌─────────────────────────────────────┐
│   Select Template by Type            │
├─────────────────────────────────────┤
│ USER → USER_INVITATION (email)       │
│ SERVICE_PROVIDER → PROVIDER_INVITATION
│ SALES_PARTNER → SALES_INVITATION     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   Send via Channel                   │
├─────────────────────────────────────┤
│ Email → SendGrid API                 │
│ Phone → Twilio API                   │
└─────────────────────────────────────┘
    ↓
Return Link to Admin
    ↓
Admin Shares Link (copy or send)
    ↓
User Receives Email/SMS
    ↓
User Clicks Link → Registration Page
    ↓
Validate Invitation
    ↓
Show Registration Form (prefilled)
    ↓
User Submits Registration
    ↓
Create User + SalesPartner Relationship
    ↓
Mark Invitation as ACCEPTED
    ↓
Redirect to Login
```

---

## ✅ Deployment Checklist

- [ ] SendGrid account created
- [ ] SendGrid API key obtained (starts with SG.)
- [ ] From email configured (noreply@youfujia.ca or similar)
- [ ] Twilio account created
- [ ] Twilio Account SID obtained
- [ ] Twilio Auth Token obtained
- [ ] Twilio phone number obtained (purchased)
- [ ] Email templates initialized in database
- [ ] SMS templates exist in database
- [ ] Environment variables set correctly
- [ ] Test invitation creation successful
- [ ] Test email delivery confirmed
- [ ] Test SMS delivery confirmed
- [ ] Admin dashboard accessible
- [ ] API endpoints return correct responses
- [ ] Error handling tested (invalid input)
- [ ] Duplicate prevention tested
- [ ] Audit logging verified

---

## 📖 Full Documentation

For comprehensive documentation, see:
- **Architecture & Design:** `docs/SALES_PARTNER_SYSTEM.md`
- **Implementation Details:** `SALES_PARTNER_IMPLEMENTATION.md`

---

## 🎓 Code References

**Email Service:**
- File: `lib/email.ts`
- Functions: `sendEmail()`, `sendTemplatedEmail()`, `renderTemplate()`

**SMS Service:**
- File: `lib/sms.ts`
- Functions: `sendSMS()`, `sendTemplatedSMS()`, `renderSMSTemplate()`

**API Integration:**
- File: `app/api/admin/sales-partners/[id]/invite/route.ts`
- Uses email and SMS services with fallback error handling

**Test Script:**
- File: `scripts/test-invitation-service.ts`
- Run: `npx ts-node scripts/test-invitation-service.ts`

---

## 🔄 Next Steps

1. **Configure real credentials** - Add SendGrid and Twilio keys
2. **Test in development** - Create test invitations
3. **Verify email/SMS delivery** - Check inbox/phone
4. **Deploy to staging** - Test in staging environment
5. **Monitor in production** - Check logs and metrics
6. **Iterate on templates** - Refine email/SMS content

---

**Status:** ✅ Ready for Production
**Last Updated:** 2026-02-26
**Version:** 1.0.0
