# 优服佳 - 身份认证系统指南

## 概述

优服佳采用多角色身份认证系统，支持三种主要用户类型：
1. **服务商 (Service Provider)** - 提供各类服务的专业人士
2. **销售合伙人 (Sales Partner)** - 通过推荐客户获得佣金的合伙人
3. **网站管理员 (Admin)** - 平台管理员，负责平台运营

## 用户角色与权限

### 服务商 (SERVICE_PROVIDER)

**访问入口:** `/auth/login/service-provider`

**认证方式:**
- 手机号 + 密码
- Apple 登录
- 邮箱登录

**主要功能:**
- 管理个人档案
- 管理服务和定价
- 查看和管理预约
- 与客户沟通
- 查看收入统计
- 管理可用时间

**仪表板:** `/dashboard/service-provider`

**权限:**
- `manage:own-profile` - 管理自己的档案
- `manage:own-services` - 管理自己的服务
- `view:bookings` - 查看预约
- `manage:own-bookings` - 管理自己的预约
- `communicate:clients` - 与客户沟通
- `view:earnings` - 查看收入
- `manage:availability` - 管理可用性

---

### 销售合伙人 (SALES_PARTNER)

**访问入口:** `/auth/login/sales-partner`

**认证方式:**
- 邮箱 + 密码
- 需要邀请码

**注册要求:**
- 有效邮箱地址
- 安全密码 (至少8个字符)
- 邀请码 (可选，获得额外奖励)

**主要功能:**
- 查看推荐链接
- 管理推荐代码
- 查看佣金统计
- 查看绩效统计
- 访问排行榜

**仪表板:** `/dashboard/sales-partner`

**权限:**
- `view:referrals` - 查看推荐
- `manage:referral-links` - 管理推荐链接
- `view:commissions` - 查看佣金
- `view:statistics` - 查看统计
- `communicate:team` - 与团队沟通
- `view:leaderboard` - 查看排行榜

**奖励计划:**
- 首次注册: ￥100 代金券
- 推荐服务商: 佣金比例
- 推荐客户: 佣金比例

---

### 网站管理员 (ADMIN)

**访问入口:** `/auth/login/admin`

**认证方式:**
- 邮箱 + 密码 + 两步验证码
- 需要邀请注册

**安全特性:**
- ✅ 强制两步验证 (Two-Factor Authentication)
- ✅ 邮箱验证码 (6位数字)
- ✅ 登录监听和审计日志
- ✅ IP 地址限制 (可配置)
- ✅ 登录尝试限制

**主要功能:**
- 管理所有用户
- 管理所有服务
- 平台设置管理
- 查看所有分析数据
- 内容管理
- API 密钥管理
- AI 配置管理
- 查看系统日志
- 财务管理
- 管理审核人员

**仪表板:** `/admin`

**权限:**
- `manage:all-users` - 管理所有用户
- `manage:all-services` - 管理所有服务
- `manage:platform-settings` - 管理平台设置
- `view:all-analytics` - 查看所有分析
- `manage:content` - 管理内容
- `manage:api-keys` - 管理 API 密钥
- `manage:ai-config` - 管理 AI 配置
- `view:logs` - 查看日志
- `manage:financial` - 管理财务
- `manage:moderators` - 管理审核人员

---

## 登录流程

### 1. 角色选择

用户首先访问 `/auth` 页面选择他们的身份：
- 服务商
- 销售合伙人
- 管理员

```
/auth
├─ /auth/login/service-provider
├─ /auth/login/sales-partner
└─ /auth/login/admin
```

### 2. 服务商登录流程

```
输入手机号 + 密码
    ↓
验证手机号格式
    ↓
查询用户数据库
    ↓
验证密码
    ↓
检查账户状态
    ↓
生成 JWT 令牌
    ↓
重定向到 /dashboard/service-provider
```

**登录表单字段:**
- 手机号 (必填) - 格式: 10-15位数字
- 密码 (必填) - 至少8个字符

**登录失败原因:**
- 用户不存在
- 密码错误
- 账户已禁用
- 登录尝试过多 (锁定15分钟)

### 3. 销售合伙人登录流程

```
选择注册/登录
    ↓
输入邮箱 + 密码 (+ 邀请码)
    ↓
验证邮箱格式
    ↓
查询用户数据库
    ↓
验证密码
    ↓
检查邮箱验证状态
    ↓
生成 JWT 令牌
    ↓
重定向到 /dashboard/sales-partner
```

**登录表单字段:**
- 邮箱 (必填) - 有效邮箱格式
- 密码 (必填) - 至少8个字符

**注册表单字段:**
- 名字 (必填) - 2-50个字符
- 邮箱 (必填) - 有效邮箱格式
- 密码 (必填) - 至少8个字符，需要大写字母和数字
- 确认密码 (必填) - 必须与密码相同
- 邀请码 (可选) - 获得额外奖励

### 4. 管理员登录流程 (带两步验证)

```
输入邮箱 + 密码
    ↓
验证邮箱格式和密码
    ↓
查询用户数据库
    ↓
生成临时会话
    ↓
发送两步验证码到邮箱
    ↓
↓
用户输入 6 位验证码
    ↓
验证验证码有效性 (10分钟内)
    ↓
生成 JWT 令牌
    ↓
记录登录日志
    ↓
重定向到 /admin
```

**登录步骤 1:**
- 邮箱 (必填) - 有效邮箱格式
- 密码 (必填) - 至少8个字符

**登录步骤 2:**
- 验证码 (必填) - 6位数字
- 有效期: 10分钟

---

## API 端点

### 登录

**POST** `/api/auth/login`

**请求体:**
```json
{
  "email": "user@example.com",      // ADMIN 和 SALES_PARTNER
  "phone": "+1-416-555-0000",       // SERVICE_PROVIDER
  "password": "SecurePassword123",
  "role": "SERVICE_PROVIDER"        // SERVICE_PROVIDER, SALES_PARTNER, ADMIN
}
```

**响应 (成功):**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "phone": "+1-416-555-0000",
    "role": "SERVICE_PROVIDER",
    "name": "张三"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "redirectUrl": "/dashboard/service-provider"
}
```

**响应 (需要2FA):**
```json
{
  "success": true,
  "requiresTwoFA": true,
  "sessionId": "temp_session_id",
  "message": "验证码已发送到您的邮箱"
}
```

**响应 (失败):**
```json
{
  "success": false,
  "error": "用户名或密码错误"
}
```

---

### 注册

**POST** `/api/auth/register`

**请求体:**
```json
{
  "name": "用户名",
  "email": "user@example.com",
  "phone": "+1-416-555-0000",
  "password": "SecurePassword123",
  "role": "SERVICE_PROVIDER",       // SERVICE_PROVIDER, SALES_PARTNER
  "invitationCode": "ABC123"        // SALES_PARTNER (可选)
}
```

**响应:**
```json
{
  "success": true,
  "message": "注册成功，请验证您的邮箱",
  "user": {
    "id": "user_456",
    "name": "用户名",
    "email": "user@example.com",
    "role": "SERVICE_PROVIDER"
  },
  "verificationEmailSent": true
}
```

---

### 两步验证

**POST** `/api/auth/verify-2fa`

**请求体:**
```json
{
  "sessionId": "temp_session_id",
  "code": "123456"
}
```

**响应 (成功):**
```json
{
  "success": true,
  "message": "验证成功",
  "user": {
    "id": "admin_123",
    "email": "admin@youfujia.ca",
    "role": "ADMIN",
    "name": "管理员"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "redirectUrl": "/admin"
}
```

**响应 (失败):**
```json
{
  "success": false,
  "error": "验证码无效或已过期"
}
```

---

### 忘记密码

**POST** `/api/auth/forgot-password`

**请求体:**
```json
{
  "email": "user@example.com",
  "phone": "+1-416-555-0000"        // 至少提供一个
}
```

**响应:**
```json
{
  "success": true,
  "message": "密码重置链接已发送，请检查您的邮箱或短信"
}
```

**安全提示:** API 总是返回成功响应，不会透露用户是否存在。

---

## 密码策略

### 密码强度要求

所有角色都需要遵守以下密码策略：

✅ **最低长度:** 8 个字符
✅ **必须包含:** 至少一个大写字母
✅ **必须包含:** 至少一个数字
❌ **特殊字符:** 可选（不强制）

**示例有效密码:**
- `ServicePro123`
- `Partner2024!`
- `Admin@Secure99`

**示例无效密码:**
- `password` - 无大写字母和数字
- `Pass123` - 长度小于8
- `ALLUPPERCASE123` - 无法满足

---

## 安全特性

### 登录尝试限制

- **最大尝试次数:** 5 次
- **锁定时长:** 15 分钟
- **锁定后消息:** "登录尝试过多，请在15分钟后重试"

### Session 管理

- **有效期:** 24 小时
- **自动刷新:** 支持 refresh token
- **Refresh Token 有效期:** 7 天
- **Cookie 设置:** HttpOnly, Secure, SameSite=Lax

### 两步验证 (2FA)

- **对象:** 仅管理员 (ADMIN)
- **方式:** 邮箱验证码
- **验证码长度:** 6 位数字
- **有效期:** 10 分钟
- **重新发送:** 允许

### 其他安全措施

- ✅ HTTPS 强制
- ✅ CSRF 保护
- ✅ 密码哈希 (bcrypt with salt rounds: 10)
- ✅ 邮件验证
- ✅ 登录日志审计
- ✅ IP 地址记录
- ✅ 异常登录检测

---

## 用户验证流程

### 电子邮件验证

1. 用户注册时发送验证邮件
2. 邮件包含 24 小时有效的验证链接
3. 用户点击链接验证邮箱
4. 验证成功后可以完全使用账户

### 手机号验证

1. 用户注册或更新手机号时发送验证码 (SMS)
2. 验证码有效期: 10 分钟
3. 用户输入验证码确认
4. 验证成功后手机号被激活

---

## 第三方登录 (OAuth)

### 支持的提供商

1. **Apple 登录**
   - 配置文件: `/lib/oauth/apple.ts`
   - Scope: `email`, `name`

2. **邮箱登录 (Magic Link)**
   - 配置文件: `/lib/oauth/email.ts`
   - 发送魔法链接到邮箱
   - 有效期: 24 小时

### 流程

```
用户选择第三方登录
    ↓
重定向到提供商
    ↓
用户授权
    ↓
回调处理
    ↓
创建或更新用户
    ↓
生成 JWT 令牌
    ↓
重定向到对应仪表板
```

---

## 错误处理

### 常见错误代码

| 错误代码 | HTTP 状态 | 描述 | 解决方案 |
|---------|---------|------|--------|
| `INVALID_CREDENTIALS` | 401 | 用户名或密码错误 | 检查输入或重置密码 |
| `USER_NOT_FOUND` | 404 | 用户不存在 | 注册新账户 |
| `ACCOUNT_DISABLED` | 403 | 账户已禁用 | 联系管理员 |
| `ACCOUNT_LOCKED` | 429 | 登录尝试过多 | 等待15分钟后重试 |
| `INVALID_2FA_CODE` | 401 | 验证码无效或过期 | 请求新的验证码 |
| `EMAIL_NOT_VERIFIED` | 403 | 邮箱未验证 | 检查邮箱并点击验证链接 |
| `MISSING_REQUIRED_FIELDS` | 400 | 缺少必填字段 | 填写所有必填字段 |
| `INVALID_EMAIL_FORMAT` | 400 | 邮箱格式无效 | 输入有效的邮箱地址 |
| `PASSWORD_TOO_WEAK` | 400 | 密码强度不足 | 按照密码政策要求修改 |

---

## 开发指南

### 环境变量配置

```env
# JWT 配置
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# 邮件配置
SENDGRID_API_KEY=your-sendgrid-key
SENDER_EMAIL=noreply@youfujia.ca

# SMS 配置
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# OAuth 配置
APPLE_CLIENT_ID=com.youfujia.apple-sign-in
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key

# 数据库
DATABASE_URL=your-database-url
```

### 使用认证中间件

```typescript
import { authMiddleware } from '@/lib/middleware/auth';

// 保护 API 路由
export const middleware = authMiddleware({
  requiredRoles: ['SERVICE_PROVIDER', 'ADMIN'],
});

// 保护页面路由
export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth',
        permanent: false,
      },
    };
  }

  return { props: {} };
}
```

### 获取当前用户

```typescript
import { getSession } from '@/lib/auth';

const session = await getSession();
console.log(session.user);
// {
//   id: 'user_123',
//   email: 'user@example.com',
//   role: 'SERVICE_PROVIDER',
//   name: '张三'
// }
```

---

## 常见问题

**Q: 如何重置密码?**
A: 在登录页面点击"忘记密码?"，输入邮箱或手机号，您将收到重置链接。

**Q: 2FA 验证码过期了怎么办?**
A: 点击"重新发送"按钮获取新的验证码，有效期为 10 分钟。

**Q: 可以同时登录多个设备吗?**
A: 可以，每个设备维护独立的会话，最多可同时使用 5 个会话。

**Q: 忘记了邀请码怎么办?**
A: 销售合伙人邀请码可以在注册后更新，或联系推荐您的合伙人。

**Q: 如何修改账户信息?**
A: 登录后在个人档案页面修改，某些敏感信息需要密码确认。

**Q: 账户被锁定了怎么办?**
A: 登录尝试过多会触发 15 分钟锁定，或联系支持团队。

---

## 支持与联系

- 📧 技术支持: [support@youfujia.ca](mailto:support@youfujia.ca)
- 📱 客服热线: +1-416-555-0000
- 🕐 工作时间: 周一至周日 9:00-21:00 (EST)

---

**最后更新:** 2024-02-26
**版本:** 1.0.0
