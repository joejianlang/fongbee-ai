# 优服佳 - YouFuJia Platform

优服佳是一个集本地服务与 AI-News Feed 的综合生态平台，包含：

1. **AI-News Feed** - 聚合 RSS、YouTube 等多源内容，支持 AI 翻译、摘要、分类
2. **社区论坛** - 地理位置标签（Geo-tag）的本地社交讨论
3. **优服佳服务体系** - 包含标准服务、简单定制、复杂定制三种交易模式

## 技术栈

- **前端**: Next.js 15 + React 19 + Tailwind CSS
- **后端**: Next.js API Routes + Prisma ORM
- **数据库**: PostgreSQL（Supabase）
- **支付**: Stripe（Manual Capture 流程）
- **认证**: NextAuth.js v5
- **通知**: Firebase Cloud Messaging
- **定时任务**: node-cron

## 项目结构

```
youfujia/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── (app)/             # 移动端/Web 应用
│   ├── admin/             # 管理后台
│   └── layout.tsx
├── lib/
│   ├── db.ts              # Prisma Client
│   ├── types/             # TypeScript 类型定义
│   └── utils/             # 工具函数
├── components/            # React 组件库
├── prisma/
│   ├── schema.prisma      # 数据库 Schema
│   └── seed.ts            # 初始化数据
├── public/                # 静态资源
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## 开发步骤

### 1. 环境配置

```bash
# 复制环境配置
cp .env.example .env.local

# 编辑 .env.local，设置数据库 URL 和 API 密钥
```

### 2. 安装依赖

```bash
npm install
```

### 3. 初始化数据库

```bash
# 运行 Prisma 迁移
npm run db:migrate

# 或使用 Supabase 的 db push
npm run db:push

# 执行初始化数据
npm run db:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 数据库 Schema 概览

### 核心模型 (11 大业务域)

1. **用户认证系统** - User, AuthToken
2. **服务商与评价** - ServiceProvider, Review
3. **标准服务** - ServiceCategory, Service, ServicePriceOption
4. **支付与财务** - PaymentPolicy, Order, Payment, Escrow, Payout
5. **简单定制服务** - CustomRequest, Bid, CustomServiceTemplate
6. **复杂定制服务** - Project, Contract, Milestone
7. **社区论坛** - Post, Comment （带 Geo-tag）
8. **AI-News Feed** - Article, ArticleTag, UserInterest, UserArticleInteraction
9. **通知系统** - Notification, Subscription
10. **AI 爬虫** - RssFeed, AiTaskLog
11. **管理审计** - AdminLog, SystemConfig

### 关键特性

- ✅ **Stripe Manual Capture** - 预授权 + 48h/36h/72h 自动划扣
- ✅ **支付政策可配置** - 按服务类型灵活设置违约金、定金比例
- ✅ **合同版本控制** - Diff 显示修改内容，双方互认
- ✅ **地理位置查询** - 论坛帖子按地区过滤
- ✅ **AI 文本处理** - 翻译、摘要、情感分析、自动标签

## API 端点概览

### 用户认证

- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/verify-email` - 验证邮箱
- `GET /api/auth/profile` - 获取当前用户

### 服务管理

- `GET /api/services` - 获取服务列表
- `GET /api/services/:id` - 获取服务详情
- `POST /api/services` - 创建服务（服务商）
- `GET /api/service-categories` - 获取分类

### 订单管理

- `POST /api/orders` - 创建订单（预授权）
- `POST /api/orders/:id/confirm-payment` - 支付确认
- `GET /api/orders/:id` - 获取订单详情
- `GET /api/orders` - 获取订单列表
- `POST /api/orders/:id/cancel` - 取消订单
- `POST /api/orders/:id/complete` - 标记完成

### 定制服务

- `GET /api/custom-services/templates` - 获取模板
- `POST /api/custom-requests` - 发布需求
- `POST /api/custom-requests/:id/select-bid` - 选定报价
- `POST /api/bids` - 提交报价

### 项目与合同

- `POST /api/projects` - 创建项目
- `POST /api/contracts` - 生成合同
- `GET /api/contracts/:id` - 获取合同
- `POST /api/contracts/:id/update` - 修改合同（新版本）
- `GET /api/contracts/:id/diff/:fromVersion` - 查看 Diff

### 支付与财务

- `POST /api/payments/authorize` - 创建支付意图
- `POST /api/payments/capture` - 手动划扣
- `POST /api/payments/refund` - 退款

### 论坛

- `GET /api/forum/posts` - 获取帖子（地理过滤）
- `POST /api/forum/posts` - 发布帖子
- `POST /api/forum/posts/:id/comments` - 发评论

### AI-News Feed

- `GET /api/feed` - 获取个性化 feed
- `GET /api/feed/categories` - 获取分类
- `POST /api/articles/:id/like` - 点赞文章

### 管理后台

- `GET /api/admin/orders` - 订单管理
- `GET /api/admin/payment-policies` - 支付政策列表
- `POST /api/admin/payment-policies` - 创建/更新政策
- `GET /api/admin/stats` - 仪表板统计

## 支付流程详解

### 标准服务订单流程

```
1. 用户选择服务 + 时段
   ↓
2. API POST /api/orders
   - 创建 Order (status: PENDING)
   - 调用 Stripe PaymentIntent.create(confirm_type: "manual")
   - 返回 stripeIntentId 和 clientSecret
   ↓
3. 前端使用 Stripe.js 完成支付
   ↓
4. POST /api/orders/:id/confirm-payment
   - 更新 Order status: AUTHORIZED
   - 记录 authorizedAt 和 scheduledCaptureAt
   ↓
5. Cron Job（定时任务）在 scheduledCaptureAt 时刻触发
   - 检查 Order status 为 AUTHORIZED
   - 调用 Stripe PaymentIntent.confirm()
   - 更新 status: CAPTURED
   - 转账到服务商余额
   ↓
6. 服务开始
   - 用户点击"开始工作"
   - status: IN_PROGRESS
   ↓
7. 服务完成
   - 用户验收并评价
   - status: COMPLETED
   ↓
8. 结算
   - 支付余款（如需）
   - status: SETTLED
```

### 48h 取消规则

- **48h 前取消** → 定金全额退回
- **48h 内取消** → 定金没收（转为服务商收入）

## 快速开发指南

### 添加新的 API 端点

1. 在 `app/api/` 下创建路由文件
2. 使用 Prisma 进行数据库操作
3. 返回标准 `ApiResponse` 格式

```typescript
// app/api/example/route.ts
import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const data = await prisma.someModel.findMany();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### 添加新的 React 组件

1. 在 `components/` 下创建组件文件
2. 使用 Tailwind CSS 进行样式
3. 遵循 ai-news-feed 的设计规范

```tsx
// components/MyComponent.tsx
export default function MyComponent() {
  return (
    <div className="bg-card border border-card-border rounded-lg p-6">
      {/* Content */}
    </div>
  );
}
```

## 部署

### Vercel（推荐）

```bash
vercel deploy
```

### Docker

```bash
docker build -t youfujia .
docker run -p 3000:3000 youfujia
```

## 故障排查

### 数据库连接错误

确保 `DATABASE_URL` 正确指向 PostgreSQL/Supabase

```bash
# 测试连接
prisma db execute --stdin < /dev/null
```

### 类型错误

重新生成 Prisma Client：

```bash
prisma generate
```

### 构建失败

清理 `.next` 目录：

```bash
rm -rf .next
npm run build
```

## 许可证

ISC
