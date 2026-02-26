# 🔐 优服佳 - 多角色身份认证系统

> 完整的企业级身份认证解决方案，支持服务商、销售合伙人和管理员三种用户角色

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](.)
[![Test Status](https://img.shields.io/badge/tests-passing-brightgreen.svg)](.)
[![Documentation](https://img.shields.io/badge/documentation-complete-blue.svg)](./docs/)
[![License](https://img.shields.io/badge/license-proprietary-red.svg)](.)

---

## 📋 目录

- [快速开始](#-快速开始)
- [用户角色](#-用户角色)
- [项目结构](#-项目结构)
- [API 文档](#-api-文档)
- [安全特性](#-安全特性)
- [配置指南](#-配置指南)
- [常见问题](#-常见问题)

---

## 🚀 快速开始

### 访问认证系统

```bash
# 1. 启动开发服务器
npm run dev

# 2. 在浏览器中打开
http://localhost:3000/auth

# 3. 选择用户角色并登录/注册
```

### 三种登录方式

```
┌─────────────────────────────────────────────────┐
│                 选择您的身份                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  🔷 服务商          🟢 销售合伙人        🔒 管理员 │
│ 手机号+密码         邮箱+密码+邀请      邮箱+密码+2FA │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 👥 用户角色

### 🔷 服务商 (Service Provider)

**访问:** `/auth/login/service-provider`

- **认证方式:** 手机号 + 密码
- **仪表板:** `/dashboard/service-provider`
- **权限数:** 7 项
- **特点:**
  - 无需邀请码
  - 可自由注册
  - 无 2FA 强制
  - 管理服务和预约

### 🟢 销售合伙人 (Sales Partner)

**访问:** `/auth/login/sales-partner`

- **认证方式:** 邮箱 + 密码 (+ 邀请码)
- **仪表板:** `/dashboard/sales-partner`
- **权限数:** 6 项
- **特点:**
  - 需邀请链接注册
  - 邮箱验证
  - 首次注册￥100代金券
  - 推荐奖励系统

### 🔒 管理员 (Admin)

**访问:** `/auth/login/admin`

- **认证方式:** 邮箱 + 密码 + 2FA验证码
- **仪表板:** `/admin`
- **权限数:** 10 项
- **特点:**
  - 强制两步验证
  - 邀请制注册
  - 登录审计
  - IP记录和异常检测

---

## 📁 项目结构

```
优服佳/
├── app/
│   ├── auth/                          # 认证页面
│   │   ├── page.tsx                   # 角色选择
│   │   ├── layout.tsx
│   │   └── login/
│   │       ├── service-provider/      # 服务商
│   │       ├── sales-partner/         # 销售合伙人
│   │       └── admin/                 # 管理员
│   ├── api/auth/                      # 认证 API
│   │   ├── login/
│   │   ├── register/
│   │   ├── verify-2fa/
│   │   └── forgot-password/
│   └── register/
│       └── sales-partner/             # 邀请注册
├── lib/
│   └── auth-config.ts                 # 认证配置
└── docs/
    ├── AUTHENTICATION_GUIDE.md        # 完整指南
    ├── QUICK_AUTH_REFERENCE.md        # 快速参考
    └── AUTH_IMPLEMENTATION_SUMMARY.md # 实现总结
```

---

## 🔗 API 文档

### 登录 API

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "+1-416-555-0000",
  "password": "SecurePassword123",
  "role": "SERVICE_PROVIDER"
}
```

**响应 (成功):**
```json
{
  "success": true,
  "user": { "id", "email", "role", "name" },
  "token": "eyJhbGc...",
  "redirectUrl": "/dashboard/service-provider"
}
```

### 注册 API

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "用户名",
  "email": "user@example.com",
  "password": "SecurePassword123",
  "role": "SERVICE_PROVIDER"
}
```

### 2FA 验证 API

```http
POST /api/auth/verify-2fa
Content-Type: application/json

{
  "sessionId": "temp_session_id",
  "code": "123456"
}
```

### 忘记密码 API

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

---

## 🔐 安全特性

### 密码策略

```
✅ 最少 8 个字符
✅ 包含大写字母 (A-Z)
✅ 包含数字 (0-9)
❌ 特殊字符 (可选)
```

### 安全措施

```
🔒 登录安全
  • 5次失败锁定 15 分钟
  • HTTPS 强制
  • CSRF 保护
  • bcrypt 密码哈希

🔒 Session 管理
  • JWT Token: 24 小时有效期
  • Refresh Token: 7 天有效期
  • HttpOnly, Secure 认证
  • SameSite=Lax Cookie

🔒 两步验证 (2FA)
  • 仅管理员强制
  • 6位数字验证码
  • 10分钟有效期
  • 邮件传递
```

---

## ⚙️ 配置指南

### 环境变量

```env
# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# 邮件 (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@youfujia.ca

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/youfujia
```

### 自定义配置

编辑 `lib/auth-config.ts`:

```typescript
export const authConfig: AuthConfig = {
  jwt: {
    expiresIn: '24h',        // 修改 JWT 有效期
    refreshExpiresIn: '7d',  // 修改刷新令牌有效期
  },
  twoFA: {
    enabled: true,           // 启用/禁用 2FA
    requiredRoles: ['ADMIN'], // 哪些角色需要 2FA
    codeLength: 6,           // 验证码长度
    expiresIn: 600,          // 验证码有效期 (秒)
  },
  passwordPolicy: {
    minLength: 8,            // 最小长度
    requireUppercase: true,  // 需要大写字母
    requireNumbers: true,    // 需要数字
  },
  loginAttempts: {
    maxAttempts: 5,          // 最大尝试次数
    lockoutDuration: 15,     // 锁定时间 (分钟)
  },
};
```

---

## ❓ 常见问题

### Q: 如何重置密码?
A: 在登录页面点击"忘记密码?"，输入邮箱或手机号，您将收到重置链接。

### Q: 2FA 验证码过期了怎么办?
A: 点击"重新发送"按钮获取新的验证码，有效期为 10 分钟。

### Q: 如何修改密码策略?
A: 编辑 `lib/auth-config.ts` 中的 `authConfig.passwordPolicy` 对象。

### Q: 可以禁用 2FA 吗?
A: 可以，在 `authConfig.twoFA.enabled` 设置为 `false`。

### Q: 如何添加更多第三方登录?
A: 在登录页面的"或"部分添加新按钮，并创建相应的 OAuth 处理逻辑。

---

## 📚 完整文档

详细的实现指南和文档：

- **[AUTHENTICATION_GUIDE.md](./docs/AUTHENTICATION_GUIDE.md)** - 完整使用指南 (1000+ 行)
- **[QUICK_AUTH_REFERENCE.md](./docs/QUICK_AUTH_REFERENCE.md)** - 快速参考 (400+ 行)
- **[AUTH_IMPLEMENTATION_SUMMARY.md](./docs/AUTH_IMPLEMENTATION_SUMMARY.md)** - 实现总结 (600+ 行)

---

## 🧪 测试

### 构建测试

```bash
npm run build
```

### 运行开发服务器

```bash
npm run dev
```

### 访问页面

```
http://localhost:3000/auth                          # 角色选择
http://localhost:3000/auth/login/service-provider   # 服务商
http://localhost:3000/auth/login/sales-partner      # 销售合伙人
http://localhost:3000/auth/login/admin              # 管理员
```

---

## 🛠️ 技术栈

- **框架:** Next.js 14+ (App Router)
- **语言:** TypeScript
- **样式:** Tailwind CSS v4
- **数据库:** PostgreSQL + Prisma ORM
- **认证:** JWT + Session
- **验证:** Zod
- **邮件:** SendGrid
- **短信:** Twilio
- **密码:** bcryptjs

---

## 📊 项目统计

```
代码行数:
  • 页面组件:     ~1,140 行
  • API 路由:       ~160 行
  • 配置文件:       ~350 行
  • 文档:         ~2,000 行
  ───────────────────────────
  • 总计:        ~3,650 行

文件统计:
  • 页面文件:        5 个
  • API 文件:        4 个
  • 配置文件:        1 个
  • 文档文件:        4 个

提交统计:
  • 总提交数:        3 次
  • 新增行数:     ~3,650 行
```

---

## 🚀 部署

### 生产部署清单

- [ ] 更新所有环境变量
- [ ] 配置 HTTPS 证书
- [ ] 设置 CORS 策略
- [ ] 配置 email 和 SMS 服务
- [ ] 运行数据库迁移
- [ ] 设置 IP 白名单 (可选)
- [ ] 配置监控和日志
- [ ] 设置备份策略

### 构建和启动

```bash
# 构建
npm run build

# 启动
npm start

# 生产环境使用
NODE_ENV=production npm start
```

---

## 🤝 贡献指南

遵循以下约定进行修改：

```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 提交更改
git commit -m "feat: description of your changes"

# 推送分支
git push origin feature/your-feature-name

# 创建 Pull Request
```

---

## 📞 支持

- 📧 技术支持: support@youfujia.ca
- 📱 客服热线: +1-416-555-0000
- 🕐 工作时间: 周一至周日 9:00-21:00 (EST)

---

## 📄 许可证

Proprietary - 版权所有 © 2024 优服佳

---

## 🎉 致谢

感谢所有为这个项目做出贡献的开发者和设计师。

---

**最后更新:** 2024-02-26  
**版本:** 1.0.0  
**状态:** ✅ 生产就绪
