# CLAUDE.md — 优服佳 (YouFuJia) 开发宪章执行手册

**版本**: 2.0 (宪章 v2 全量对齐)
**最后更新**: 2026-02-25
**宪章状态**: ✅ CPO 已批准进入编码阶段

---

## 🤖 每次会话启动：上下文自检（强制）

> Agent 必须在每轮对话开始时默读并声明以下原则，防止跑偏：

- [ ] Stripe Manual Capture + 48h Cron 自动划扣（不可硬编码时间）
- [ ] 数据必须存储于加拿大境内节点（Supabase Canada / ca-central-1）
- [ ] PWA 必须实现 Service Workers + 离线缓存 + Web Push
- [ ] AODA/WCAG 2.1 AA 级合规（对比度、键盘导航、ARIA）
- [ ] CPPA 算法透明度：AI 决策必须写入 AIDecisionLog 并可查询
- [ ] 被遗忘权：一键抹除接口 `POST /api/my/data-deletion`
- [ ] 合同版本控制：Myers Diff（行级）+ 电子签名
- [ ] 原子化提交：每次 PR < 200 行，附完成标准
- [ ] TDD：复杂逻辑先写测试，后写业务代码
- [ ] AI 成本：复杂调用 > $0.05/call 需 CPO 批准

---

## 📌 项目定位

**"信息认知 + 社交撮合 + 交易执行"** 三位一体生态

| 层 | 模块 | 核心价值 |
|----|------|---------|
| 信息层 | AI-News Feed | RSS/YouTube → AI 提炼 → 个性化推荐 |
| 社交层 | 社区论坛 | Geo-tag 本地内容，Geohash 半径检索 |
| 交易层 | 优服佳服务 | 标准/简单定制/复杂定制，Stripe 托管支付 |

---

## 🏗️ 技术栈（锁定版本，不得随意升级）

| 类别 | 技术 | 版本 | 备注 |
|------|------|------|------|
| 框架 | Next.js | 14.2.x | ⚠️ 不用 15，配置文件不兼容 |
| React | React | 18.3.x | ⚠️ 不用 19，与 testing-library 冲突 |
| 认证 | NextAuth.js | 4.24.x | ⚠️ 不用 v5，仍在 beta |
| ORM | Prisma | 5.20.x | 搭配 PostgreSQL，不用 SQLite |
| 数据库 | Supabase PostgreSQL | Canada Region | ⚠️ 建项目时必须选 Canada (Central) |
| 缓存 | Upstash Redis | Canada Region | 语义缓存 + Cron 幂等锁 |
| 支付 | Stripe | 15.x | Manual Capture 模式 |
| Passkeys | SimpleWebAuthn | latest | 纯 TS，数据不出境 |
| CSS | Tailwind CSS + Shadcn UI | 3.4.x | 统一组件库 |
| 部署 | Vercel | - | Serverless，按需计费 |
| WAF | Cloudflare | - | DDoS + AI 接口限流 |

**安装命令**（固定）:
```bash
npm install --legacy-peer-deps
```

---

## 🚀 快速启动

```bash
cd /Users/joelyan/Documents/AI-Combo/youfujia
docker-compose up -d            # 启动 PostgreSQL（本地开发）
npm run db:push                 # 同步 Schema
npm run db:seed                 # 种子数据
npm run dev                     # http://localhost:3000
```

| 地址 | 用途 |
|------|------|
| localhost:3000 | 主页 |
| localhost:3000/app | 用户端（Feed/服务/论坛） |
| localhost:3000/admin | 管理端 |
| localhost:5555 | Prisma Studio |

遇问题 → `TROUBLESHOOTING.md`

---

## 🔑 关键 Gotchas（血泪教训）

| # | ❌ 错误做法 | ✅ 正确做法 | 原因 |
|---|-----------|-----------|------|
| 1 | `next.config.ts` | `next.config.js` | Next.js 14 不支持 TS 配置文件 |
| 2 | `node prisma/seed.js` | `node --loader ts-node/esm prisma/seed.ts` | seed 文件是 TS |
| 3 | 硬编码 `48` 小时 | 从 `PaymentPolicy.autoCaptureHoursBefore` 读取 | 管理员可配置 |
| 4 | `npm install` | `npm install --legacy-peer-deps` | React 18/19 对等依赖冲突 |
| 5 | SQLite | PostgreSQL | SQLite 不支持 Decimal、JSON Array |
| 6 | 直接存卡号 | Stripe Hosted Fields | PCI-DSS 合规，服务器不碰卡数据 |
| 7 | 在组件内硬编码颜色 | CSS 变量 `var(--color-primary)` | 主题系统统一管理 |
| 8 | API 路由用 `index.ts` | `route.ts` | Next.js App Router 约定 |
| 9 | Cron 不加幂等锁 | `await redisLock(lockKey)` | 并发防重复划扣 |
| 10 | 修改枚举后不重新生成 | `npx prisma generate` | Client 类型需同步 |

---

## 🍁 加拿大合规要求（强制）

### 数据驻留
- **所有 PII 必须存储于 Supabase Canada Region（ca-central-1）**
- Supabase 建项目时选 **Canada (Central)**，之后无法迁移
- Redis 用 Upstash Canada Region
- 文件存储（PAD 协议 PDF、合同）用 Supabase Storage Canada

### PII 字段标注规范
Schema 注释中标明分类，便于合规 Agent 审查：
```
// @pii:IDENTITY    - 姓名、头像
// @pii:CONTACT     - 邮箱、电话
// @pii:CREDENTIAL  - 密码 hash、MFA secret、Passkey
// @pii:FINANCIAL   - 银行账号末4位、机构编号
// @pii:SENSITIVE   - 生日、SIN 末4位
```

### CPPA 被遗忘权
```
POST /api/my/data-deletion
→ 用户发起删除请求
→ 写入 DataDeletionRequest（status=PENDING）
→ 后台任务：匿名化 PII 字段（不物理删除，保留 7 年财务记录）
→ 返回完成确认 + 保留原因说明
```

### CPPA 算法透明度
**任何 AI 影响用户的决策必须写入 AIDecisionLog**：
```typescript
// 写入日志示例
await prisma.aIDecisionLog.create({
  data: {
    userId,
    decisionType: 'FRAUD_DETECTION',
    explanation: '您的服务商评分低于平台最低标准(3.0)，已被降低推荐权重',
    modelUsed: 'gpt-4o-mini',
    costUsd: 0.0002,
  }
})
// 用户可查询: GET /api/my/ai-decisions
```

### AODA/WCAG 2.1 AA 合规
所有 UI 组件必须满足：
- 对比度：正文 ≥ 4.5:1，大字 ≥ 3:1
- 键盘可导航：`focus-visible:ring-2` 聚焦环可见
- 图片 `alt` 文字必填
- 表单 `label` 与 `input` 关联
- ARIA landmarks：`role="main"`, `role="navigation"`
- 动态内容：`aria-live="polite"`
- 支持 `prefers-contrast: high`

---

## 💾 数据库 Schema 全量概览（v2）

```
业务域                  核心模型
────────────────────────────────────────────────────────────────
1. 用户认证             User, AuthToken, Passkey
2. 内容源管理           FeedSource, FeedCrawlLog             ⭐NEW
3. AI 文章              Article, ArticleTag, ArticleEmbedding ⭐NEW
4. 兴趣推荐             UserInterest, UserArticleInteraction
5. 论坛                 Post, Comment, PostGeoTag             ⭐NEW
6. 服务商               ServiceProvider, ServiceCategory, Review
7. 标准服务             Service, PriceOption, TimeSlot
8. 支付政策             PaymentPolicy（动态配置，管理员可改）  ✅
9. 订单状态机           Order, Payment, Escrow, Payout
10. 定制服务            CustomRequest, Bid
11. 合同项目            Project, Contract, ContractVersion     ⭐NEW
                        Milestone, ContractSignature          ⭐NEW
12. PAD 协议            PADAuthorization                      ⭐NEW (≥$1,000)
13. 通知                Notification, Subscription, SMSLog    ⭐NEW
14. 合规                AIDecisionLog, AIUsageQuota           ⭐NEW
                        AISemanticCache, DataDeletionRequest  ⭐NEW
15. 管理审计            AdminLog, SystemConfig
```

**关键枚举**（完整版）：
```prisma
enum OrderStatus {
  PENDING AUTHORIZED CRON_CAPTURING CAPTURED
  IN_PROGRESS PENDING_SETTLEMENT COMPLETED SETTLED
  CANCELLED CANCELLED_FORFEITED REFUNDED DISPUTED
}

enum ContractVersionStatus { DRAFT PENDING SIGNED SUPERSEDED }
enum PADStatus              { ACTIVE SUSPENDED REVOKED }
enum DeletionStatus         { PENDING PROCESSING COMPLETED PARTIALLY_RETAINED }
enum AIDecisionType         { CONTENT_RECOMMENDATION SERVICE_RANKING
                              PRICE_SUGGESTION FRAUD_DETECTION CONTRACT_ANALYSIS }
enum FeedType               { RSS YOUTUBE }
```

---

## 💳 Stripe 支付协议（锁定）

### Manual Capture 状态机
```
PENDING ──[createPaymentIntent(capture_method="manual")]──► AUTHORIZED
AUTHORIZED ──[T-48h Cron 自动]──────────────────────────► CAPTURED
AUTHORIZED ──[用户取消 >T-48h]─────────────────────────► REFUNDED
CAPTURED   ──[用户取消 <T-48h]─────────────────────────► CANCELLED_FORFEITED
CAPTURED   ──[用户确认开始]────────────────────────────► IN_PROGRESS
IN_PROGRESS ──[用户确认完工]───────────────────────────► PENDING_SETTLEMENT
PENDING_SETTLEMENT ──[尾款支付]─────────────────────────► COMPLETED
COMPLETED  ──[T+7 系统结算]────────────────────────────► SETTLED
```

### 48h Cron Job 核心（伪代码）
```typescript
// POST /api/cron/capture-payments  ← 每 5 分钟触发
async function capturePaymentsCron() {
  const lock = await redisLock(`cron:capture:${hourKey()}`)
  if (!lock) return { skipped: true }

  const orders = await prisma.order.findMany({
    where: { status: 'AUTHORIZED', scheduledCaptureAt: { lte: new Date() }, captureAttempts: { lt: 3 } }
  })

  for (const order of orders) {
    const policy = await prisma.paymentPolicy.findFirst({ where: { serviceType: order.serviceType } })
    // ^ 不硬编码 48，从 policy.autoCaptureHoursBefore 读取

    await stripe.paymentIntents.capture(order.paymentIntentId)
    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: 'CAPTURED' } }),
      prisma.escrow.create({ data: { orderId: order.id, amount: order.depositAmount, status: 'HOLDING' } }),
      prisma.payment.create({ ... })
    ])
  }
}
```

### PAD 协议（≥ CAD $1,000）
- 金额 < $1,000：Stripe 信用卡 Manual Capture（普通流程）
- 金额 ≥ $1,000：PAD 授权 → 用户电子签名 → 生成 PDF → 存 Supabase Storage Canada → EFT 扣款
- 相关模型：`PADAuthorization`

---

## 📄 合同版本控制（复杂服务）

### Diff 算法
- **选型**：Myers Diff，行级，npm 包 `diff@^5.1.0`
- **存储**：`ContractVersion.diffFromPrev`（JSON 序列化）
- **格式**：`[{ type: "equal"|"delete"|"insert", lineStart, lineEnd, text }]`

### 签名流程
```
A 提交新版本 → status=DRAFT
→ 系统生成 Diff → status=PENDING（通知对方）
→ 对方签名 ContractSignature → status=SIGNED
→ 旧版本 → status=SUPERSEDED
```

---

## 🧠 AI 成本控制（强制）

### 分层调用策略
| Tier | 任务 | 模型 | 预算 |
|------|------|------|------|
| 1 (边缘) | 分类、摘要 | gpt-4o-mini / claude-3-haiku | < $0.001/call |
| 2 (核心) | 合同分析、推荐 | claude-3.5-sonnet | < $0.05/call |
| 2+ (高级) | 超复杂分析 | claude-opus / gpt-4o | **需 CPO 批准** |

### 语义缓存（Upstash Redis）
```typescript
const cacheKey = sha256(normalizePrompt(prompt))
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

const result = await callAI(prompt)
await redis.setex(cacheKey, 3600, JSON.stringify(result)) // TTL=1h
```

### Token 配额
- 每用户每日上限：50,000 tokens（可在管理端调整）
- 超限返回 `429 Too Many Requests`
- 模型：`AIUsageQuota`（按 `[userId, date]` 唯一约束）

---

## 🗺️ LBS 实现（Geohash）

```typescript
// 写入帖子时计算 Geohash
import geohash from 'ngeohash'
const hash = geohash.encode(latitude, longitude, 7) // 精度 ~150m

// 半径检索（5km）
const nearbyHashes = geohash.neighbors(centerHash) // 9 个邻居格
await prisma.postGeoTag.findMany({
  where: { geohash: { in: nearbyHashes } }
})
```

**Gotcha**：Geohash 精度级别 7 对应约 150m，搜 5km 半径时取中心格 + 8 个邻居格（共 9 个）即可覆盖

---

## 🌐 API 路由全量（v2）

```
/api/auth/        register POST ✅ | login POST | logout POST | refresh POST
/api/feed/        sources CRUD | articles GET ✅ | personalized GET
/api/forum/       posts GET/POST ✅ | posts/[id]/like POST | comments POST
/api/services/    GET/POST ✅ | [id] GET | [id]/time-slots GET
/api/orders/      GET/POST ✅ | [id]/confirm-payment POST ✅
                  [id]/cancel POST | [id]/start POST | [id]/complete POST
/api/custom/      requests POST | requests/[id]/bids GET/POST | bids/[id]/accept POST
/api/contracts/   [id] GET | [id]/versions GET/POST | [id]/sign POST
/api/cron/        capture-payments POST ✅ | settle-completed POST | crawl-feeds POST
/api/admin/       payment-policies GET/POST ✅ | feed-sources CRUD
                  users GET | disputes GET/POST
/api/my/          ai-decisions GET | data-deletion POST  ← CPPA 合规端点
```

---

## 🎨 UI 规范

### 组件库（Tailwind CSS + Shadcn UI）
位置：`components/`，命名：PascalCase

**已实现**：Navbar, Button, Input, Textarea, Card, StatsCard, ArticleCard, ServiceCard

### AODA 必用模式
```tsx
// ✅ 跳过导航
<a href="#main-content" className="sr-only focus:not-sr-only">跳到主要内容</a>

// ✅ 屏幕阅读器只读文字
<span className="sr-only">4.9 out of 5 stars</span>

// ✅ 聚焦环（不用 outline-none）
className="focus-visible:ring-2 focus-visible:ring-primary"

// ✅ 动态内容通知
<div aria-live="polite" aria-atomic="true" id="status-announcer" />
```

### CSS 变量（不要硬编码颜色）
```css
:root { --color-primary: #2563eb; --color-danger: #dc2626; }
[data-theme="dark"] { --color-primary: #60a5fa; }
[prefers-contrast: high] { --color-primary: #1d4ed8; }
```

---

## 🔐 安全规范

- 密码加密：`bcryptjs`，cost factor 10
- 环境变量：`.env` 不提交 git（只提交 `.env.example`）
- Supabase RLS：所有表强制启用行级安全策略
- Passkeys：`SimpleWebAuthn`（数据不出境）
- MFA：TOTP，secret 加密存储（`@pii:CREDENTIAL`）

---

## 🔧 常用命令

```bash
# 开发
npm run dev                     # localhost:3000
npm run build && npm run start  # 生产预览

# 数据库
npm run db:push                 # 同步 Schema（开发用）
npm run db:migrate              # 生成迁移文件（生产用）
npm run db:studio               # localhost:5555
npm run db:seed                 # 种子数据

# 代码质量
npm run lint
npx prisma generate             # 修改 Schema 后必须执行

# Docker（本地开发）
docker-compose up -d
docker-compose logs -f postgres
docker-compose down -v          # ⚠️ 删除所有数据
```

---

## 🐛 常见错误速查

| 错误信息 | 解决方案 |
|---------|---------|
| `Can't reach database server` | `docker-compose up -d` |
| `MODULE_NOT_FOUND: seed.js` | 已配 ts-node，直接 `npm run db:seed` |
| `next.config.ts not supported` | 用 `next.config.js`（已修复） |
| `Decimal not supported` | 必须用 PostgreSQL，不能用 SQLite |
| `Peer dependency conflicts` | `npm install --legacy-peer-deps` |
| `EACCES prisma client` | `npx prisma generate` |
| `Port already in use` | `lsof -ti:3000 \| xargs kill -9` |
| `RLS policy violation` | 检查 Supabase RLS 策略是否允许当前 role |

---

## 📊 项目状态

| 指标 | 数值 |
|------|------|
| 总文件 | 40+ |
| 代码行数 | 5,000+ |
| Prisma 模型 | 70+（v2 含合规模型） |
| API 端点（已实现） | 10 |
| API 端点（待实现） | 20+ |
| React 组件 | 8 |
| Git commits | 8 |

---

## 📋 WBS 进度（Phase 追踪）

- [ ] **Phase 1**: 基础设施重构（Schema v2 + Supabase Canada + Redis + Passkeys）
- [ ] **Phase 2**: 支付状态机（Stripe + 48h Cron + PAD + 单测）
- [ ] **Phase 3**: 服务交易体系（标准→定制→合同 Diff）
- [ ] **Phase 4**: AI-News Feed（爬虫 + 分层 AI + 缓存 + 配额）
- [ ] **Phase 5**: 社区论坛（Geohash LBS）
- [ ] **Phase 6**: 合规（被遗忘权 + AI 透明度 + AODA 审计）
- [ ] **Phase 7**: PWA（Service Workers + Web Push）
- [ ] **Phase 8**: QA（状态机 100% 单测 + 合同 Diff 测试）

---

## 📋 维护日志

| 日期 | 更新 |
|------|------|
| 2026-02-25 v1.0 | 初始创建，记录 MVP Gotchas |
| 2026-02-25 v2.0 | 宪章 v2 全量对齐：加拿大合规、PAD、Passkeys、Geohash、AI 成本、AODA、合同 Diff、WBS |
