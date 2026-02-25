# 优服佳 本地测试指南

**最后更新**: 2026-02-24
**版本**: 0.1.0

---

## 📋 前置要求

- Node.js 18+
- npm / yarn / pnpm
- Docker & Docker Compose （用于 PostgreSQL 数据库）
- 推荐系统: macOS, Linux

---

## 🚀 快速启动（3 步）

### 步骤 1：启动 PostgreSQL 数据库

```bash
cd /Users/joelyan/Documents/AI-Combo/youfujia

# 启动 PostgreSQL 容器
docker-compose up -d

# 检查数据库是否就绪
docker-compose ps
```

预期输出：
```
youfujia-postgres   postgres:15-alpine   healthy
```

### 步骤 2：初始化项目

```bash
# 已安装的依赖
# npm install --legacy-peer-deps

# 初始化数据库 Schema
npm run db:push

# 初始化种子数据（分类、管理员、支付政策）
npm run db:seed
```

### 步骤 3：启动开发服务器

```bash
npm run dev
```

预期输出：
```
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

## 🧪 测试应用

### 访问应用

| 应用 | URL | 用途 |
|------|-----|------|
| **主页** | http://localhost:3000 | 应用导航首页 |
| **用户端** | http://localhost:3000/app | Feed、服务市场、论坛 |
| **管理端** | http://localhost:3000/admin | 仪表板、支付政策 |
| **Prisma Studio** | npm run db:studio | 数据库图形界面 |

---

## 📝 测试场景

### 场景 1：用户注册与登录

#### 用户注册
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }'
```

预期响应：
```json
{
  "success": true,
  "data": {
    "id": "user-id-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }
}
```

### 场景 2：浏览服务

#### 获取服务列表
```bash
curl http://localhost:3000/api/services \
  -H "Accept: application/json"
```

查询参数：
- `categoryId` - 按分类过滤
- `search` - 搜索关键词
- `city` - 按城市过滤
- `page` - 分页（默认 1）
- `limit` - 每页数量（默认 20）

### 场景 3：创建订单与 Stripe 支付

#### 创建订单
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "service-id-123",
    "priceOptionId": "price-option-id",
    "scheduledStartTime": "2026-03-01T10:00:00Z",
    "location": "123 Main St, Guelph, ON"
  }'
```

预期响应：
```json
{
  "success": true,
  "data": {
    "id": "order-id-123",
    "status": "PENDING",
    "paymentIntentId": "pi_test_...",
    "clientSecret": "pi_test_..._secret_...",
    "totalAmount": "150.00"
  }
}
```

#### 使用 Stripe 测试卡片

在前端完成支付时使用：

| 场景 | 卡号 | 状态 |
|------|------|------|
| **成功** | 4242 4242 4242 4242 | ✅ 支付成功 |
| **失败** | 4000 0000 0000 0002 | ❌ 支付拒绝 |
| **过期日期** | 任意未来日期 | 例：12/25 |
| **CVC** | 任意 3 位数 | 例：123 |

#### 确认支付
```bash
curl -X POST http://localhost:3000/api/orders/order-id-123/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_test_...",
    "clientSecret": "pi_test_..._secret_..."
  }'
```

### 场景 4：48 小时自动划扣 Cron Job

#### 原理
1. 订单创建时，设置 `scheduledCaptureAt` = `scheduledStartTime - 48小时`
2. Cron Job 每 5 分钟检查一次
3. 当时间到达时，自动调用 Stripe `confirm()` 进行划扣

#### 模拟测试

```bash
# 1. 创建一个订单，设置 scheduledStartTime 为 10 分钟后
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "service-id-123",
    "priceOptionId": "price-option-id",
    "scheduledStartTime": "2026-02-25T05:00:00Z"  # 10 分钟后
  }'

# 2. 确认支付（这会将订单状态更新为 AUTHORIZED）
curl -X POST http://localhost:3000/api/orders/order-id-123/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{ ... }'

# 3. 等待或手动触发 Cron Job
curl -X POST http://localhost:3000/api/cron/capture-payments \
  -H "x-api-key: test-cron-secret-for-local-testing"

# 4. 检查订单状态，应该变为 CAPTURED
npm run db:studio  # 打开 Prisma Studio 查看 Order 表
```

### 场景 5：管理支付政策

#### 获取所有支付政策
```bash
curl http://localhost:3000/api/admin/payment-policies \
  -H "Accept: application/json"
```

#### 创建/更新支付政策
```bash
curl -X POST http://localhost:3000/api/admin/payment-policies \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "standard",
    "autoCaptureHoursBefore": 48,
    "isAutoCaptureEnabled": true,
    "cancellationCutoffHours": 48,
    "forfeitturePercentage": 20,
    "depositPercentage": 30,
    "refundDays": 7
  }'
```

#### 在管理端 UI 修改
访问 http://localhost:3000/admin/payment-policies

- 点击「+ 新建政策」或编辑现有政策
- 修改参数：
  - 提前划扣时间（小时）：可设为 36/48/72
  - 违约金比例：例如 20%
  - 定金比例：例如 30%
- 点击「保存」
- **修改立即生效，无需重启服务器**

---

## 🛠️ 故障排查

### 问题 1：数据库连接失败

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解决方案**：
```bash
# 检查 Docker 容器是否运行
docker-compose ps

# 如果未运行，启动容器
docker-compose up -d

# 检查容器日志
docker-compose logs postgres
```

### 问题 2：Prisma 类型错误

```
Error: EACCES: permission denied, open '.prisma/client'
```

**解决方案**：
```bash
# 重新生成 Prisma Client
npx prisma generate

# 或完全重新初始化
rm -rf node_modules .prisma
npm install --legacy-peer-deps
npm run db:push
```

### 问题 3：端口被占用

```
Error: listen EADDRINUSE :::3000
```

**解决方案**：
```bash
# 杀死占用 3000 端口的进程
lsof -ti:3000 | xargs kill -9

# 或使用不同的端口
PORT=3001 npm run dev
```

### 问题 4：样式/CSS 加载异常

```bash
# 清理 Next.js 缓存
rm -rf .next

# 重新构建
npm run build
npm run dev
```

### 问题 5：Stripe 支付失败

检查以下内容：

1. `.env` 文件中的 Stripe 密钥是否正确
2. 是否使用了正确的测试卡号
3. 服务器日志中是否有错误信息

---

## 📊 数据库操作

### 查看数据库

```bash
# 启动 Prisma Studio（图形界面）
npm run db:studio

# 访问 http://localhost:5555
```

### 查看日志

```bash
# 查看数据库容器日志
docker-compose logs -f postgres

# 查看应用日志
npm run dev

# 查看 Cron Job 日志
# 在服务器启动时会显示每次 Cron 执行的结果
```

### 重置数据库

```bash
# ⚠️ 删除所有数据！
npx prisma migrate reset

# 或删除容器和卷
docker-compose down -v
docker-compose up -d
npm run db:push
npm run db:seed
```

---

## 🎯 核心功能测试清单

- [ ] **用户认证**
  - [ ] 用户注册成功
  - [ ] 密码加密存储
  - [ ] 注册验证（email token）

- [ ] **服务浏览**
  - [ ] 获取服务列表
  - [ ] 按分类过滤
  - [ ] 按关键词搜索
  - [ ] 地理位置过滤

- [ ] **订单与支付**
  - [ ] 创建订单（PENDING 状态）
  - [ ] Stripe PaymentIntent 创建
  - [ ] 前端完成支付流程
  - [ ] 订单转为 AUTHORIZED
  - [ ] 记录支付信息

- [ ] **48h 自动划扣**
  - [ ] Cron Job 按时执行
  - [ ] 订单状态转为 CAPTURED
  - [ ] 资金转账到服务商
  - [ ] 支付日志记录

- [ ] **支付政策管理**
  - [ ] 获取所有支付政策
  - [ ] 创建新支付政策
  - [ ] 编辑支付政策
  - [ ] 修改后立即生效

- [ ] **管理仪表板**
  - [ ] 访问仪表板
  - [ ] 显示统计数据
  - [ ] 显示最近订单

- [ ] **社区论坛**
  - [ ] 发布帖子
  - [ ] 获取帖子列表（Geo-tag 过滤）

- [ ] **AI Feed**
  - [ ] 获取个性化 Feed（基于用户兴趣）

---

## 📞 常见问题

### Q: 如何重置数据库？

A: 使用以下命令（注意：会删除所有数据）：
```bash
docker-compose down -v
docker-compose up -d
npm run db:push
npm run db:seed
```

### Q: 如何查看生成的 SQL 语句？

A: 在 `.env` 中添加：
```
DEBUG="prisma:*"
```

然后运行：
```bash
npm run db:push
```

### Q: 支付政策修改需要重启服务器吗？

A: **不需要**！支付政策存储在数据库中，管理员通过 API 或后台页面修改后，应用会自动读取最新配置。

### Q: 如何测试不同的支付政策？

A: 在管理端创建多个支付政策，设置不同的服务类型（standard / simple_custom / complex_custom），然后根据订单选择不同的服务类型进行测试。

---

## 🔗 相关文档

- 📖 **项目概览**: `README.md`
- 📊 **实施总结**: `IMPLEMENTATION_SUMMARY.md`
- 🚀 **快速启动**: `QUICK_START.md`
- 📋 **本地测试**: `LOCAL_TESTING.md` (本文档)
- 📁 **数据库 Schema**: `prisma/schema.prisma`

---

## 🎉 完成！

现在你可以开始本地测试 **优服佳** 了！

遇到问题？检查上方的故障排查部分或查看 `npm run dev` 的输出。

**祝测试顺利！** 🚀
