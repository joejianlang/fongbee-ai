# 销售合伙人邀请系统 (Sales Partner Invitation System)

## 系统概述

销售合伙人邀请系统是一个完整的邀请和注册流程，允许网站管理员通过邮件或短信邀请用户、服务商或销售合伙人加入平台。

## 核心特性

✅ **邀请方式**
- 仅通过管理员邀请（无后端直接创建）
- 支持邮件邀请
- 支持短信邀请

✅ **邀请类型**
- 用户 (USER)
- 服务商 (SERVICE_PROVIDER)
- 销售合伙人 (SALES_PARTNER)

✅ **销售合伙人等级**
- 青铜级 (BRONZE)
- 白银级 (SILVER)
- 黄金级 (GOLD)

✅ **追踪统计**
- 总邀请用户数
- 总邀请服务商数
- 周邀请用户数
- 月邀请用户数

✅ **安全机制**
- 邀请链接30天有效期
- 唯一邀请码绑定
- 重复角色注册防护
- 完整的操作日志审计

## 系统架构

### 数据库模型

#### SalesPartner（销售合伙人）
```typescript
{
  id: string              // 唯一标识
  userId: string          // 关联用户（唯一）
  companyName: string     // 公司名称
  tier: string           // 等级：BRONZE | SILVER | GOLD
  status: string         // 状态：ACTIVE | INACTIVE | SUSPENDED
  referralCode: string   // 邀请码（唯一）
  createdAt: DateTime
}
```

#### SalesPartnerInvitation（邀请记录）
```typescript
{
  id: string                    // 唯一标识
  partnerId: string             // 销售合伙人ID
  inviteeEmail?: string         // 被邀请人邮箱
  inviteePhone?: string         // 被邀请人手机
  inviteeName?: string          // 被邀请人名称
  inviteeType: string          // 邀请类型：USER | SERVICE_PROVIDER | SALES_PARTNER
  status: string               // 状态：PENDING | ACCEPTED | REJECTED | EXPIRED
  expiresAt: DateTime          // 过期时间（30天后）
  acceptedAt?: DateTime        // 接受时间
  createdAt: DateTime
}
```

#### SalesPartnerStats（统计信息）
```typescript
{
  id: string
  partnerId: string
  totalUsersInvited: number     // 总邀请用户
  totalProvidersInvited: number // 总邀请服务商
  weekUsersInvited: number      // 周邀请用户
  monthUsersInvited: number     // 月邀请用户
}
```

### API 端点

#### 管理员邀请 API

**POST /api/admin/sales-partners/[id]/invite**

生成邀请链接并发送邮件或短信。

**请求体：**
```json
{
  "email": "user@example.com",  // 可选，邮箱地址
  "phone": "+11234567890",      // 可选，手机号码
  "name": "User Name",           // 可选，被邀请人名称
  "type": "USER"                 // 必需，邀请类型
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "invitationId": "clx123...",
    "invitationLink": "https://youfujia.ca/register/sales-partner?...",
    "referralCode": "SP12345...",
    "expiresAt": "2026-03-27T...",
    "target": "user@example.com",
    "type": "USER",
    "templateType": "USER_INVITATION"
  }
}
```

**错误处理：**
```json
// 用户已存在
{
  "success": false,
  "error": "用户已存在，无法重复注册用户角色。该用户邮箱: user@example.com"
}

// 用户已有该角色
{
  "success": false,
  "error": "该用户已是服务商，无法重复注册服务商角色。该用户邮箱: user@example.com"
}

// 邮箱和手机号都没提供
{
  "success": false,
  "error": "邮箱和手机号至少填一个"
}
```

**GET /api/admin/sales-partners/[id]/invite**

获取该销售合伙人的所有邀请记录。

**查询参数：**
- `status`: 邀请状态过滤 (PENDING | ACCEPTED | REJECTED | EXPIRED)
- `type`: 邀请类型过滤 (USER | SERVICE_PROVIDER | SALES_PARTNER)
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）

**响应：**
```json
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

#### 公开邀请验证 API

**GET /api/sales-partners/invitations/[invitationId]/validate**

验证邀请链接是否有效（在注册页面使用）。

**响应：**
```json
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

**错误响应：**
```json
// 邀请已过期
{
  "success": false,
  "error": "邀请已过期"
}

// 邀请已被接受
{
  "success": false,
  "error": "邀请状态已是 ACCEPTED"
}
```

### 邮件模板

#### USER_INVITATION（用户邀请）
- **主题：** `[优服佳] {{inviterName}} 邀请您加入优服佳`
- **变量：** name, inviterName, invitationCode, signupLink
- **用途：** 销售合伙人邀请普通用户注册

#### PROVIDER_INVITATION（服务商邀请）
- **主题：** `[优服佳] 邀请您加入我们的服务商平台`
- **变量：** name, registerLink
- **用途：** 销售合伙人邀请专业人士成为服务商

#### SALES_INVITATION（销售合伙人邀请）
- **主题：** `[优服佳] 邀请您成为销售合伙人`
- **变量：** name, invitationLink
- **用途：** 销售合伙人邀请新的销售合伙人加入

### 短信模板

#### PROVIDER_INVITE（服务商邀请）
- **用途：** 所有邀请类型通用（USER, SERVICE_PROVIDER, SALES_PARTNER）
- **变量：** invitationLink, invitationCode, type

## 前端使用

### 管理员邀请界面

**路由：** `/admin/users/sales-partners`

**功能：**
1. 按等级筛选销售合伙人
2. 查看销售合伙人统计信息
3. 简化的邀请表单
   - 输入：邮箱或手机号
   - 选择：邀请类型（用户、服务商、销售合伙人）
4. 生成并复制邀请链接

**表单流程：**
```
1. 选择销售合伙人
2. 点击"发送邀请"按钮
3. 输入邮箱或手机号
4. 选择邀请类型
5. 点击"生成邀请链接"
6. 显示邀请链接，可复制
7. 邮件/短信自动发送（如已配置）
```

### 注册页面

**路由：** `/register/sales-partner`

**查询参数：**
- `invitation`: 邀请ID
- `referral`: 销售合伙人邀请码

**工作流：**
1. 验证邀请（通过 `/api/sales-partners/invitations/[id]/validate`）
2. 如果邀请有效，显示注册表单
3. 预填充邮箱和名称（如邀请中提供）
4. 提交注册后，创建用户和销售合伙人账户
5. 接受邀请并绑定关系
6. 重定向到登录页面

## 集成指南

### 配置邮件服务

**环境变量：**
```env
SENDGRID_API_KEY=SG.your_actual_api_key
SENDGRID_FROM_EMAIL=noreply@youfujia.ca
```

**测试邮件发送：**
```bash
# 运行测试脚本
npx ts-node scripts/test-invitation-service.ts
```

### 配置短信服务

**环境变量：**
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 错误处理

邮件或短信发送失败不会中断邀请创建流程：
- 邀请链接仍会生成
- 管理员可以手动分享链接
- 错误会被记录到控制台

```typescript
try {
  await sendTemplatedEmail(...)
} catch (emailError) {
  console.error(`⚠️  邮件发送失败:`, emailError);
  // 继续执行，不中断流程
}
```

## 工作流示例

### 场景：邀请用户加入平台

1. **管理员操作**
   - 访问 `/admin/users/sales-partners`
   - 选择销售合伙人"公司A"
   - 点击"发送邀请"
   - 输入 `user@example.com`
   - 选择类型"用户"
   - 点击"生成邀请链接"

2. **系统操作**
   - 验证邮箱未被注册
   - 创建邀请记录 (PENDING, 30天有效期)
   - 生成链接：`/register/sales-partner?invitation=clx123&referral=SP12345`
   - 通过SendGrid发送邮件

3. **用户操作**
   - 收到邮件，点击注册链接
   - 系统验证邀请有效
   - 填写注册表单（邮箱预填）
   - 提交注册
   - 创建用户账户
   - 创建销售合伙人关系
   - 邀请状态更新为 ACCEPTED

### 场景：防止重复注册

1. **第一次邀请**
   - 邀请 `user@example.com` 作为"用户"
   - 邮件发送成功

2. **二次邀请（相同邮箱，相同角色）**
   - 邀请 `user@example.com` 作为"用户"
   - 系统返回错误：
     ```
     "用户已存在，无法重复注册用户角色。该用户邮箱: user@example.com"
     ```

3. **跨角色邀请（相同邮箱，不同角色）**
   - 用户已注册为普通用户
   - 邀请相同邮箱作为"服务商"
   - 系统允许（用户可以有多个角色）
   - 创建新的邀请记录

## 数据库初始化

### 创建邮件模板

```bash
npx ts-node scripts/init-email-templates.ts
```

### 创建SMS模板

运行数据库迁移以确保SMS模板表存在。

## 监控和审计

所有邀请操作都会被记录到 `AdminLog` 表：

```json
{
  "action": "CREATE",
  "resourceType": "SalesPartnerInvitation",
  "resourceId": "clx123...",
  "changesJson": {
    "partnerId": "sp123...",
    "inviteeEmail": "user@example.com",
    "inviteePhone": null,
    "inviteeType": "USER",
    "contact": "user@example.com"
  }
}
```

## 常见问题

**Q: 如果邮件/短信发送失败怎么办？**
A: 邀请链接仍会生成。管理员可以手动复制链接并通过其他方式分享给被邀请人。

**Q: 邀请链接的有效期是多久？**
A: 30天。过期后邀请无法使用，需要重新发送。

**Q: 一个用户可以有多个销售合伙人吗？**
A: 不可以。每个用户只能绑定一个销售合伙人（通过 `invitedBySalesPartnerId` 唯一约束）。

**Q: 如何重新发送邀请？**
A: 重新调用邀请API并使用相同的邮箱/手机号。系统会创建新的邀请记录。

**Q: 邀请链接可以分享给其他人吗？**
A: 可以。邀请链接本身没有限制，任何拥有链接的人都可以使用。但需要注意的是，只有第一个完成注册的人才能绑定邀请。

## 技术细节

### 邀请链接格式

```
https://youfujia.ca/register/sales-partner?
  referral=SP12345ABCDEF&
  invitation=clxabcdef...
```

### 参考码生成

```typescript
function generateReferralCode(): string {
  return 'SP' + crypto.randomBytes(12).toString('hex').toUpperCase().substring(0, 14);
}
// 结果：SP12345ABCDEF... (16个字符)
```

### 模板变量渲染

```typescript
renderTemplate(
  '[优服佳] {{inviterName}} 邀请您加入优服佳',
  { inviterName: '公司A' }
)
// 结果：[优服佳] 公司A 邀请您加入优服佳
```

## 相关文件

- **API:** `app/api/admin/sales-partners/[id]/invite/route.ts`
- **前端:** `app/admin/users/sales-partners/page.tsx`
- **注册页:** `app/register/sales-partner/page.tsx`
- **邮件服务:** `lib/email.ts`
- **短信服务:** `lib/sms.ts`
- **测试脚本:** `scripts/test-invitation-service.ts`
- **邮件模板初始化:** `scripts/init-email-templates.ts`
