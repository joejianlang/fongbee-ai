# CLAUDE.md - 优服佳项目开发指南

**最后更新**: 2026-02-25
**项目版本**: 0.1.0 (MVP)
**维护者**: Claude AI + Development Team

---

## 📌 项目快速概览

**优服佳** 是一个三层生态系统：
1. **信息层** (AI-News Feed) - 全球信息聚合与本地化推荐
2. **社交层** (社区论坛) - Geo-tag 本地社交网络
3. **交易层** (服务体系) - 标准/定制/项目类服务交易

**技术栈**: Next.js 14 + Prisma + PostgreSQL + Stripe

---

## 🚀 快速启动（新开发者必读）

```bash
# 1. 进入项目
cd /Users/joelyan/Documents/AI-Combo/youfujia

# 2. 启动 PostgreSQL
docker-compose up -d

# 3. 初始化数据库
npm run db:push && npm run db:seed

# 4. 启动开发服务器
npm run dev

# 5. 访问应用
# - 主页: http://localhost:3000
# - 用户端: http://localhost:3000/app
# - 管理端: http://localhost:3000/admin
```

如遇问题，查看 `TROUBLESHOOTING.md`

---

## 🔑 关键技术决策与 Gotchas

### 1. Next.js 配置文件格式

**❌ 不要用**: `next.config.ts`
**✅ 应该用**: `next.config.js`

**原因**: Next.js 14 不支持 TypeScript 配置文件。项目已在 `next.config.js` 中配置。

**相关命令**:
```bash
# 如果编译出错，确保使用的是 .js 而不是 .ts
npx next build
```

---

### 2. TypeScript Seed 脚本执行

**❌ 不要用**: `node prisma/seed.js`
**✅ 应该用**: `node --loader ts-node/esm prisma/seed.ts`

**已配置在 package.json**:
```json
"db:seed": "node --loader ts-node/esm prisma/seed.ts"
```

**直接运行**:
```bash
npm run db:seed
```

**相关依赖**: `ts-node@^10.9.2` (已安装)

---

### 3. Prisma 与 PostgreSQL 最小配置

**数据库模式**: PostgreSQL 15 Alpine (Docker)

**关键文件**:
- `prisma/schema.prisma` - 60+ 数据模型
- `.env` - DATABASE_URL 必须配置

**常用命令**:
```bash
npm run db:push      # 同步 Schema 到数据库
npm run db:migrate   # 创建迁移文件
npm run db:studio    # 打开 Prisma Studio (http://localhost:5555)
```

**Gotcha**: SQLite 与 SQLite 都不兼容 Decimal、JSON 数组等类型，必须用 PostgreSQL

---

### 4. 依赖版本兼容性

**固定版本** (不要升级):
- `next@^14.2.0` - Next.js 15 配置文件格式不同
- `react@^18.3.0` - React 19 与 @testing-library 有冲突
- `next-auth@^4.24.0` - v5 还在 beta，不稳定

**安装方式**:
```bash
npm install --legacy-peer-deps
```

**Gotcha**: 使用 `npm install` 而不是 `npm ci` 时，务必加 `--legacy-peer-deps` 以跳过 React 18/19 的对等依赖冲突

---

### 5. 环境变量与本地测试

**必需变量** (在 `.env` 中):
```env
DATABASE_URL=postgresql://youfujia_user:youfujia_password@localhost:5432/youfujia
NEXTAUTH_SECRET=<至少 32 字符>
NEXTAUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
```

**本地测试用占位符**:
```env
STRIPE_SECRET_KEY=sk_test_placeholder_local_testing_only
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder_local_testing_only
CRON_API_KEY=test-cron-secret-for-local-testing
```

**Gotcha**: `.env.local` 优先级比 `.env` 高，开发时保留两个文件

---

## 💾 数据库设计关键点

### Prisma Schema 结构

**60+ 模型** 按业务域分组 (注释标记):

```prisma
// 1. User & Auth Models (用户认证)
model User { ... }
model AuthToken { ... }

// 2. Service Provider (服务商)
model ServiceProvider { ... }
model Review { ... }

// 3. Standard Services (标准服务)
model Service { ... }
model ServicePriceOption { ... }

// 4. Payment & Financial (支付与财务)
model PaymentPolicy { ... }      // ⭐ 关键：48h 自动划扣配置
model Order { ... }
model Payment { ... }
model Escrow { ... }
model Payout { ... }

// 5. Custom Services (定制服务)
model CustomRequest { ... }
model Bid { ... }

// 6. Projects (项目/合同)
model Project { ... }            // ⭐ 关键：版本控制支持
model Contract { ... }
model Milestone { ... }

// 7. Community (社区论坛)
model Post { ... }
model Comment { ... }

// 8. AI Feed (信息聚合)
model Article { ... }
model ArticleTag { ... }
model UserInterest { ... }

// 9. Notifications (通知)
model Notification { ... }
model Subscription { ... }

// 10. Admin (管理)
model AdminLog { ... }
model SystemConfig { ... }
```

**Gotcha**: 模型间关系需要使用 `@relation` 标记，尤其是双向关系

---

### 状态机与枚举

**关键枚举** (必须在 Prisma 中定义):

```prisma
enum OrderStatus {
  PENDING          // 待支付
  AUTHORIZED       // 支付授权（Stripe 冻结）
  CAPTURED         // 已划扣（48h 后自动）
  IN_PROGRESS      // 进行中
  COMPLETED        // 完成
  CANCELLED        // 已取消
  DISPUTED         // 纠纷中
}

enum PaymentType {
  STRIPE           // Stripe 支付
  TRANSFER         // 余额转账
  CASH             // 线下现金
}

enum UserRole {
  CUSTOMER         // 客户
  PROVIDER         // 服务商
  ADMIN            // 管理员
}
```

**Gotcha**: 修改枚举时需要生成新的 Prisma Client (`npx prisma generate`)

---

## 🔄 API 设计模式

### 标准 Response 格式

**所有 API 返回统一格式**:

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 示例：
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com"
  }
}
```

**在 `lib/types/index.ts` 中定义**

---

### 路由组织规则

**目录结构**:
```
app/api/
├── auth/             # 认证相关
│   └── register/
├── services/         # 服务浏览
├── orders/           # 订单管理
│   └── [id]/
│       └── confirm-payment/
├── cron/             # 定时任务
│   └── capture-payments/   # ⭐ 关键端点
└── admin/            # 管理端
    └── payment-policies/
```

**Gotcha**: API 路由文件名必须是 `route.ts`，不能是 `index.ts`

---

### Cron Job 实现

**48h 自动划扣关键逻辑**:

```typescript
// POST /api/cron/capture-payments
// 1. 找出所有 status=AUTHORIZED 且 scheduledCaptureAt <= now 的订单
// 2. 调用 stripe.paymentIntents.confirm(paymentIntentId)
// 3. 更新订单 status=CAPTURED
// 4. 创建 Escrow 记录
// 5. 记录 Payment 日志
// 6. 转账到 ServiceProvider.availableBalance

// 设置 Cron Job 每 5 分钟执行一次 (在 server startup 时)
```

**Gotcha**: Cron Job 需要幂等性（同一订单多次执行不能重复划扣）

---

## 🎨 UI/UX 开发规范

### 组件库位置

**位置**: `components/` 目录

**已实现** (8 个组件):
- `Navbar.tsx` - 底部导航 (mobile)
- `Button.tsx` - 按钮组件
- `Input.tsx` / `Textarea.tsx` - 表单输入
- `Card.tsx` / `StatsCard.tsx` - 卡片组件
- `ArticleCard.tsx` - 文章卡片
- `ServiceCard.tsx` - 服务卡片

**命名规则**: PascalCase，导出命名导出

---

### 全局样式与主题

**CSS 变量系统** (在 `app/globals.css`):
```css
:root {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --color-danger: #ef4444;
  /* ... */
}

[data-theme="dark"] {
  --color-primary: #60a5fa;
  /* ... */
}
```

**Tailwind 扩展** (在 `tailwind.config.ts`):
```typescript
theme: {
  extend: {
    colors: {
      primary: 'var(--color-primary)',
      // ...
    },
  },
}
```

**Gotcha**: 不要在组件内硬编码颜色，使用 CSS 变量

---

### 页面结构

**布局嵌套**:
```
app/
├── layout.tsx                    # 根布局
├── (app)/
│   ├── layout.tsx               # App 布局 (含 Navbar)
│   ├── page.tsx                 # Feed 首页
│   ├── services/
│   │   └── page.tsx             # 服务列表
│   └── ...
└── admin/
    ├── layout.tsx               # Admin 布局 (含侧边栏)
    ├── page.tsx                 # Admin 仪表板
    ├── payment-policies/
    │   └── page.tsx             # 支付政策管理
    └── ...
```

**Gotcha**: `layout.tsx` 是嵌套路由的根，路由组 `(app)` 不会添加到 URL 路径

---

## 📝 文档体系

**11 份文档** (优先级顺序):

1. **START_HERE.txt** - 5 步快速启动 ⭐ 首先看这个
2. **TROUBLESHOOTING.md** - 常见错误诊断
3. **TEST_READY.md** - 项目完整说明
4. **LOCAL_TESTING.md** - 完整测试指南
5. **QUICK_REFERENCE.txt** - 命令速查表
6. **README.md** - 项目概览
7. **TESTING_SUMMARY.md** - 测试成果
8. **IMPLEMENTATION_SUMMARY.md** - 实现细节
9. **QUICK_START.md** - 快速启动
10. **PROJECT_STATUS.md** - 项目状态
11. **CLAUDE.md** - 本文档

**Gotcha**: 文档会作为 git 提交的一部分，务必保持最新

---

## 🔧 常用命令速查

```bash
# 开发
npm run dev                  # 启动开发服务器 (localhost:3000)
npm run build               # 生产构建

# 数据库
npm run db:push             # 同步 Prisma Schema
npm run db:migrate          # 创建迁移
npm run db:studio           # 打开可视化界面 (localhost:5555)
npm run db:seed             # 执行种子脚本

# 代码质量
npm run lint                # ESLint 检查
npx prisma generate         # 重新生成 Prisma Client

# Docker
docker-compose up -d        # 启动 PostgreSQL
docker-compose down         # 停止容器
docker-compose logs postgres # 查看 PostgreSQL 日志
docker-compose ps           # 查看容器状态
```

---

## 🐛 常见错误与解决方案

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| `Can't reach database server` | PostgreSQL 未运行 | `docker-compose up -d` |
| `MODULE_NOT_FOUND: seed.js` | Seed 文件格式错误 | 使用 ts-node 运行 (已配置) |
| `next.config.ts not supported` | 配置文件格式错误 | 使用 `next.config.js` (已修复) |
| `Decimal not supported` | SQLite 限制 | 必须使用 PostgreSQL |
| `Peer dependency conflicts` | npm 版本管理 | 添加 `--legacy-peer-deps` |
| `EACCES: permission denied` | Prisma Client 权限 | `npx prisma generate` |
| `Port already in use` | 端口被占用 | `lsof -ti:3000 \| xargs kill -9` |

---

## 🔐 安全性与最佳实践

### 环境变量

- ✅ **提交到 git**: `.env.example` (模板)
- ❌ **不提交**: `.env`, `.env.local` (含密钥)
- ✅ **在 Vercel 中**: 通过 UI 或 CLI 配置

**检查 `.gitignore`**:
```
.env
.env.local
.env.*.local
```

---

### 密码加密

**库**: `bcryptjs@^2.4.3`

**使用示例** (在 seed.ts 中):
```typescript
import bcrypt from 'bcryptjs'

const hashedPassword = await bcrypt.hash(password, 10)
```

**Gotcha**: 不要明文存储密码

---

### Stripe 集成

**Manual Capture 流程**:
1. 创建 PaymentIntent (不立即扣款)
2. 用户完成前端支付
3. 调用 `paymentIntents.confirm()` 进行划扣
4. 状态转为 `CAPTURED`

**相关文件**: `app/api/orders/route.ts`, `app/api/cron/capture-payments/route.ts`

---

## 📊 项目统计

| 指标 | 数值 |
|------|------|
| 总文件数 | 40+ |
| 代码行数 | 5000+ |
| 数据模型 | 60+ |
| API 端点 | 10 |
| React 组件 | 8 |
| 文档 | 11 |
| Git commits | 7 |
| 完成度 | 95% (MVP) |

---

## 🎯 下一步开发任务

### 高优先级
- [ ] 实现剩余 API (简单定制、复杂定制)
- [ ] 完整的单元测试 (jest)
- [ ] 合同版本控制 (Diff 算法)
- [ ] E2E 测试 (Playwright)

### 中优先级
- [ ] Email 通知 (SendGrid)
- [ ] 推送通知 (Firebase)
- [ ] RSS 爬虫 (定时任务)
- [ ] 多语言支持 (i18n)

### 低优先级
- [ ] CDN 集成 (图片优化)
- [ ] 性能监控 (Sentry)
- [ ] Analytics (Mixpanel)

---

## 📞 调试技巧

### 查看实时日志

```bash
# 终端 1: 应用日志
npm run dev 2>&1 | tee app.log

# 终端 2: 数据库日志
docker-compose logs -f postgres

# 终端 3: 网络请求
# 打开浏览器 DevTools > Network 标签
```

### 检查数据库状态

```bash
# 打开 Prisma Studio
npm run db:studio

# 或用 psql 直接查询
docker-compose exec postgres psql -U youfujia_user -d youfujia
```

### 重置开发环境

```bash
# ⚠️ 删除所有数据！
docker-compose down -v
docker-compose up -d
npm run db:push
npm run db:seed
npm run dev
```

---

## 🤖 与 Claude 协作的最佳实践

### 清晰的需求表述

✅ **好**: "创建一个 API 端点来查询用户的订单列表，支持分页和按状态过滤"
❌ **差**: "做一个订单 API"

### 提供上下文

✅ **包含**: 数据模型、关键字段、返回格式
❌ **缺少**: 业务逻辑、状态机、错误处理

### 代码审查检查清单

- [ ] API 返回统一的 Response 格式
- [ ] 所有 async 函数有错误处理
- [ ] TypeScript 类型完整 (no `any`)
- [ ] 数据库操作使用 Prisma ORM
- [ ] 敏感数据已脱敏 (密钥、密码等)

---

## 📌 重要链接

- **GitHub**: `https://github.com/joelyan/youfujia` (未创建)
- **Stripe 文档**: `https://stripe.com/docs/payments/accept-card-payments`
- **Prisma 文档**: `https://www.prisma.io/docs/`
- **Next.js 文档**: `https://nextjs.org/docs`
- **Tailwind CSS**: `https://tailwindcss.com/docs`

---

## 📋 维护日志

| 日期 | 更新内容 |
|------|---------|
| 2026-02-25 | 初始创建：记录 MVP 开发中的关键决策、Gotchas 和最佳实践 |
| | 添加 7 个常见错误与解决方案 |
| | 详细记录 Stripe Manual Capture、Cron Job、状态机实现 |
| | 列出 11 份项目文档和下一步任务 |

---

**祝开发顺利！** 🚀

本文档会随着项目发展持续更新。如有补充或修正，请提交 PR。
