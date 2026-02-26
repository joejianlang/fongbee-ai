# 快速身份认证参考指南

## 页面地址汇总

```
主页面
├─ /auth                          ← 角色选择页面
│
├─ /auth/login/service-provider   ← 服务商登录/注册
├─ /auth/login/sales-partner      ← 销售合伙人登录/注册
└─ /auth/login/admin              ← 管理员登录（带2FA）

仪表板
├─ /dashboard/service-provider    ← 服务商仪表板
├─ /dashboard/sales-partner       ← 销售合伙人仪表板
└─ /admin                         ← 管理员仪表板
```

---

## 登录凭证示例

### 服务商
- **字段:** 手机号 + 密码
- **示例:**
  - Phone: `+1-416-555-0100`
  - Password: `ServicePro123`

### 销售合伙人
- **字段:** 邮箱 + 密码
- **示例:**
  - Email: `partner@youfujia.ca`
  - Password: `Partner2024!`

### 管理员
- **字段:** 邮箱 + 密码 + 验证码
- **示例:**
  - Email: `admin@youfujia.ca`
  - Password: `AdminSecure99`
  - Code: `123456` (邮箱收到)

---

## API 端点速查

```bash
# 登录
POST /api/auth/login
Content-Type: application/json
{
  "phone": "+1-416-555-0100",
  "password": "password123",
  "role": "SERVICE_PROVIDER"
}

# 注册
POST /api/auth/register
Content-Type: application/json
{
  "name": "用户名",
  "email": "user@example.com",
  "password": "password123",
  "role": "SERVICE_PROVIDER"
}

# 2FA 验证
POST /api/auth/verify-2fa
Content-Type: application/json
{
  "sessionId": "temp_session_id",
  "code": "123456"
}

# 忘记密码
POST /api/auth/forgot-password
Content-Type: application/json
{
  "email": "user@example.com"
}
```

---

## 密码要求

✅ 最少 8 个字符
✅ 包含大写字母 (A-Z)
✅ 包含数字 (0-9)
❌ 特殊字符可选

**有效示例:**
- `Service123`
- `Partner@2024`
- `Admin99Pass`

---

## 错误代码

| 错误 | 原因 | 解决 |
|------|------|------|
| `INVALID_CREDENTIALS` | 用户名或密码错误 | 检查输入 |
| `ACCOUNT_LOCKED` | 尝试过多 | 等15分钟 |
| `INVALID_2FA_CODE` | 验证码错误或过期 | 重新获取 |
| `EMAIL_NOT_VERIFIED` | 邮箱未验证 | 点击邮件链接 |
| `PASSWORD_TOO_WEAK` | 密码强度不足 | 按要求修改 |

---

## 用户角色比较表

| 特性 | 服务商 | 销售合伙人 | 管理员 |
|------|--------|----------|--------|
| 登录方式 | 手机号+密码 | 邮箱+密码 | 邮箱+密码+2FA |
| 需要邀请 | ❌ | ✅ | ✅ |
| 需要邮箱验证 | ❌ | ✅ | ✅ |
| 2FA 强制 | ❌ | ❌ | ✅ |
| 仪表板 | /dashboard/service-provider | /dashboard/sales-partner | /admin |
| 权限数 | 7 | 6 | 10 |

---

## Session 信息

```typescript
interface Session {
  user: {
    id: string;
    email?: string;
    phone?: string;
    name: string;
    role: 'SERVICE_PROVIDER' | 'SALES_PARTNER' | 'ADMIN';
    avatar?: string;
  };
  token: string;
  expiresAt: Date;
}
```

---

## 常见场景

### 场景1: 服务商注册
1. 访问 `/auth`
2. 选择"服务商"
3. 点击"注册"标签
4. 输入名字、手机号、密码
5. 点击"注册并登录"
6. 自动跳转到 `/dashboard/service-provider`

### 场景2: 销售合伙人邀请注册
1. 接收邀请链接: `/register/sales-partner?invitation=INVITE_ID`
2. 页面自动填充邀请信息
3. 输入邮箱、密码等
4. 点击"完成注册"
5. 自动跳转到登录页面
6. 使用邮箱密码登录

### 场景3: 管理员登录
1. 访问 `/auth/login/admin`
2. 输入邮箱和密码
3. 点击"下一步"
4. 等待邮件中的验证码
5. 输入 6 位验证码
6. 点击"验证并登录"
7. 自动跳转到 `/admin`

---

## 前端集成示例

```typescript
// 使用登录 API
async function handleLogin(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      role: 'SERVICE_PROVIDER'
    })
  });

  const data = await response.json();

  if (data.success) {
    // 保存 token
    localStorage.setItem('auth_token', data.token);
    // 重定向
    window.location.href = data.redirectUrl;
  } else {
    // 显示错误
    alert(data.error);
  }
}

// 获取当前用户
async function getCurrentUser() {
  const response = await fetch('/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
  });
  return await response.json();
}

// 登出
async function logout() {
  localStorage.removeItem('auth_token');
  window.location.href = '/auth';
}
```

---

## 环境变量 (.env.local)

```env
# JWT
NEXT_PUBLIC_API_URL=http://localhost:3000
JWT_SECRET=your-secret-key-here

# 邮件 (Sendgrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@youfujia.ca

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/youfujia
```

---

## 测试用例

### 测试登录验证
- ✅ 有效的邮箱/手机号和密码
- ✅ 无效的邮箱格式
- ✅ 错误的密码
- ✅ 不存在的用户
- ✅ 账户已禁用

### 测试注册验证
- ✅ 所有必填字段都已填写
- ✅ 密码过短
- ✅ 密码缺少大写字母
- ✅ 邮箱已被使用
- ✅ 邮箱格式无效

### 测试 2FA
- ✅ 有效的验证码
- ✅ 无效的验证码
- ✅ 验证码过期
- ✅ 重新发送验证码

---

**更新时间:** 2024-02-26
**版本:** 1.0.0
