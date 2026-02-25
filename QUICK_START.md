# 🚀 优服佳项目快速启动指南

## 项目位置

```
/Users/joelyan/Documents/AI-Combo/youfujia/
```

## 前置要求

- Node.js 18+
- npm / yarn
- PostgreSQL 15+ (或 Supabase)
- Stripe 账户（测试模式）

## 第 1 步：环境配置

```bash
cd /Users/joelyan/Documents/AI-Combo/youfujia

# 复制环境配置
cp .env.example .env.local
```

编辑 `.env.local`，填入以下关键信息：

```env
# 数据库（必须）
DATABASE_URL="postgresql://user:password@localhost:5432/youfujia"
# 或使用 Supabase
# DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]?schema=public"

# NextAuth（必须）
NEXTAUTH_SECRET="your-secret-key-here-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Stripe（必须）
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# 其他服务（可选）
SENDGRID_API_KEY="SG...."
OPENAI_API_KEY="sk-..."
CRON_API_KEY="your-cron-secret"

# App 配置
NEXT_PUBLIC_APP_NAME="优服佳"
NEXT_PUBLIC_DEFAULT_CURRENCY="CAD"
NEXT_PUBLIC_DEFAULT_CITY="Guelph"
```

## 第 2 步：安装依赖

```bash
npm install

# 或使用 yarn / pnpm
yarn install
pnpm install
```

## 第 3 步：数据库初始化

```bash
# 方案 A：使用 Prisma 迁移（生产推荐）
npm run db:push

# 方案 B：手动迁移
npx prisma migrate dev --name init

# 初始化数据（创建分类、管理员、支付政策）
npm run db:seed
```

## 第 4 步：启动开发服务器

```bash
npm run dev
```

输出：
```
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

## 访问应用

| 应用 | URL | 功能 |
|------|-----|------|
| **用户端** | http://localhost:3000/app | Feed、服务市场、论坛 |
| **管理端** | http://localhost:3000/admin | 仪表板、订单管理、支付政策 |
| **主页** | http://localhost:3000 | 导航页面 |

## 测试数据

### 默认管理员账户
- Email: `admin@youfujia.com`
- 密码: (需在注册时设置)

### 测试 Stripe 卡片
- 成功: `4242 4242 4242 4242`
- 失败: `4000 0000 0000 0002`
- 过期日期: 任意未来日期
- CVC: 任意 3 位数

### 初始化数据

运行 `npm run db:seed` 后自动创建：

**服务分类**:
- 家庭清洁 (Home Cleaning)
- 搬家服务 (Moving Services)
- 家电维修 (Appliance Repair)

**支付政策**:
- 标准服务: 48h 自动划扣，20% 违约金
- 简单定制: 36h 自动划扣，15% 违约金
- 复杂定制: 72h（手动处理），25% 违约金

## 常用命令

```bash
# 开发
npm run dev                    # 启动开发服务器
npm run build                  # 生产构建
npm run start                  # 启动生产服务器

# 数据库
npm run db:push               # 同步 schema 到数据库
npm run db:migrate            # 创建新迁移
npm run db:studio             # 打开 Prisma Studio
npm run db:seed               # 初始化数据

# 代码质量
npm run lint                  # 运行 ESLint
npm run format                # 格式化代码（通过 Prettier）

# 测试（待实现）
npm run test                  # 运行单元测试
npm run test:e2e              # 运行 E2E 测试
```

## 项目结构

```
youfujia/
├── app/                              # Next.js App Router
│   ├── api/                         # API 路由
│   ├── (app)/                       # 移动端应用
│   ├── admin/                       # 管理后台
│   ├── globals.css                  # 全局样式
│   └── layout.tsx                   # 根布局
├── components/                      # React 组件库
│   ├── Navbar.tsx                   # 底部导航
│   ├── Card.tsx                     # 卡片组件
│   ├── Button.tsx                   # 按钮
│   ├── Input.tsx                    # 表单输入
│   ├── ArticleCard.tsx              # 文章卡片
│   └── ServiceCard.tsx              # 服务卡片
├── lib/
│   ├── db.ts                        # Prisma Client
│   └── types/index.ts               # TypeScript 类型
├── prisma/
│   ├── schema.prisma                # 数据库 Schema
│   └── seed.ts                      # 初始化脚本
├── public/                          # 静态资源
└── [配置文件]
```

## 核心功能演练

### 1. 用户注册与登录

```bash
# 访问用户端
http://localhost:3000/app

# 注册新用户
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER"
}
```

### 2. 浏览服务

```
用户端 → 服务 → 搜索/过滤 → 点击服务查看详情
```

### 3. 创建订单与支付

```
选择服务 → 选择时段 → 下单 → 支付 → 订单确认
```

**关键**：使用 Stripe 测试卡片 `4242 4242 4242 4242`

### 4. 管理支付政策

```
后台 → 支付政策 → 编辑标准服务
- 修改自动划扣时间（48h）
- 调整违约金比例
- 设置定金百分比
```

**修改立即生效**，无需重启服务器

### 5. Stripe 自动划扣

系统每 5 分钟自动检查一次，执行：

```
1. 查找所有 scheduledCaptureAt <= 当前时间的订单
2. 调用 stripe.paymentIntents.confirm()
3. 更新订单状态为 CAPTURED
4. 转账到服务商余额
5. 记录支付日志
```

**测试方法**：
- 创建订单时 `scheduledStartTime` 设为 10 分钟后
- Cron 会自动在该时刻前 48 小时划扣
- 查看 Order 表的 `actualCapturedAt` 字段确认

## 故障排查

### 数据库连接失败

```bash
# 检查 DATABASE_URL
echo $DATABASE_URL

# 测试连接
npx prisma db execute --stdin < /dev/null
```

### Prisma 类型错误

```bash
# 重新生成 Client
npx prisma generate
```

### 样式错误

```bash
# 确保 Tailwind 配置正确
npm run build

# 清理缓存
rm -rf .next
npm run dev
```

### Stripe 集成问题

1. 确认 Secret Key 正确
2. 检查 NEXTAUTH_SECRET 已设置
3. 查看浏览器控制台 Network 标签
4. 查看服务器日志（`npm run dev` 输出）

## 下一步

1. **API 补完**：登录、简单定制、复杂定制
2. **前端页面**：订单详情、用户资料、论坛详情
3. **支付 Webhook**：处理 Stripe 异步事件
4. **AI 功能**：RSS 爬虫、文本翻译、自动标签
5. **测试**：单元 + E2E 测试覆盖
6. **部署**：Vercel / Docker 容器化

## 文档参考

- 📖 **项目概览**: `README.md`
- 📊 **实施总结**: `IMPLEMENTATION_SUMMARY.md`
- 🚀 **快速启动**: `QUICK_START.md` (本文档)
- 📋 **Schema 设计**: `prisma/schema.prisma`

## 获取帮助

- 查看 `README.md` 了解技术栈
- 查看 `IMPLEMENTATION_SUMMARY.md` 了解已实现功能
- 检查 `prisma/schema.prisma` 了解数据模型
- 查看 API 注释了解端点说明

## 常见问题

### Q: 如何重置数据库？

```bash
npx prisma migrate reset
```

⚠️ 这会删除所有数据！

### Q: 如何添加新的 API 端点？

1. 在 `app/api/` 下创建路由文件
2. 实现 GET/POST/PUT/DELETE 处理函数
3. 使用 Prisma 进行数据库操作
4. 返回标准 `ApiResponse` 格式

### Q: 如何修改数据库 Schema？

1. 编辑 `prisma/schema.prisma`
2. 运行 `npm run db:migrate`
3. 生成 Prisma Client（自动）

### Q: 如何启用暗黑模式？

编辑 `app/globals.css`，在 `:root` 或 `.dark` 类中修改 CSS 变量。

---

**最后更新**: 2026-02-24
**版本**: 0.1.0
**开发状态**: 积极开发中 🚀
