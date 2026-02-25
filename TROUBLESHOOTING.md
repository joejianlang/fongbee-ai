# 优服佳 - 故障排查指南

**最后更新**: 2026-02-25
**针对**: 本地测试设置

---

## 🔴 错误 1：数据库连接失败

```
Error: P1001: Can't reach database server at `localhost:5432`
```

### 原因
PostgreSQL 容器未运行或未就绪。

### 解决方案

#### 步骤 1：启动 PostgreSQL 容器

```bash
cd /Users/joelyan/Documents/AI-Combo/youfujia
docker-compose up -d
```

#### 步骤 2：验证容器状态

```bash
docker-compose ps
```

预期输出：
```
NAME                IMAGE              STATUS
youfujia-postgres   postgres:15-alpine healthy
```

#### 步骤 3：检查容器日志

如果状态不是 `healthy`，查看日志：

```bash
docker-compose logs postgres
```

#### 步骤 4：重新启动容器

```bash
docker-compose restart postgres
docker-compose logs postgres  # 等待"database system is ready to accept connections"
```

#### 步骤 5：验证连接

```bash
# 测试 PostgreSQL 连接
psql -h localhost -U youfujia_user -d youfujia -c "SELECT 1;"

# 或使用 Docker 内部连接
docker-compose exec postgres psql -U youfujia_user -d youfujia -c "SELECT 1;"
```

---

## 🔴 错误 2：seed.ts 文件未找到

```
Error: Cannot find module '/Users/joelyan/Documents/AI-Combo/youfujia/prisma/seed.js'
```

### 原因
package.json 中的 seed 脚本指向 seed.js，但实际文件是 seed.ts。

### 解决方案

已修复。现在运行：

```bash
npm run db:seed
```

这会使用 ts-node 正确执行 TypeScript seed 文件。

---

## 🔴 错误 3：next.config.ts 不支持

```
Error: Configuring Next.js via 'next.config.ts' is not supported.
Please replace the file with 'next.config.js' or 'next.config.mjs'.
```

### 原因
Next.js 14 不支持 TypeScript 配置文件。

### 解决方案

已修复。项目现在使用 `next.config.js`。

运行：

```bash
npm run dev
```

---

## 🟡 错误 4：Prisma Client 生成错误

```
Error: EACCES: permission denied, open '.prisma/client'
```

### 解决方案

```bash
# 重新生成 Prisma Client
npx prisma generate

# 清理并重新安装
rm -rf node_modules .prisma
npm install --legacy-peer-deps

# 重新初始化数据库
npm run db:push
npm run db:seed
```

---

## 🟡 错误 5：端口被占用

```
Error: listen EADDRINUSE :::3000
Error: listen EADDRINUSE :::5432
```

### 解决方案

#### 查找占用的进程

```bash
# 查找占用 3000 的进程
lsof -i :3000

# 查找占用 5432 的进程
lsof -i :5432
```

#### 杀死进程

```bash
# 杀死占用 3000 的进程
lsof -ti:3000 | xargs kill -9

# 杀死占用 5432 的进程
lsof -ti:5432 | xargs kill -9
```

#### 或使用不同的端口

```bash
# 使用 3001 端口
PORT=3001 npm run dev
```

---

## 🟡 错误 6：样式/CSS 加载异常

```
警告：样式未正确加载，应用看起来没有样式
```

### 解决方案

```bash
# 清理 Next.js 缓存
rm -rf .next

# 重新构建
npm run build

# 启动开发服务器
npm run dev
```

---

## 🟡 错误 7：Stripe 相关错误

```
Error: Invalid API Key provided
Error: STRIPE_SECRET_KEY not found
```

### 解决方案

#### 验证环境变量

```bash
# 查看 .env 文件中的 Stripe 配置
cat .env | grep STRIPE
```

预期输出：
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 本地测试配置

如果你没有实际的 Stripe 密钥，使用测试占位符：

```env
STRIPE_SECRET_KEY=sk_test_placeholder_local_testing_only
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder_local_testing_only
STRIPE_WEBHOOK_SECRET=whsec_placeholder_local_testing_only
```

---

## ✅ 完整的本地测试设置检查清单

使用这个清单来验证所有内容是否正确设置：

```
数据库设置
□ Docker 已安装
□ Docker Compose 已安装
□ 运行 docker-compose up -d
□ docker-compose ps 显示 youfujia-postgres 为 healthy
□ PostgreSQL 在 localhost:5432 监听

项目设置
□ 进入项目目录: cd /Users/joelyan/Documents/AI-Combo/youfujia
□ package.json 已更新 (next.config.js, ts-node, seed 脚本)
□ npm install --legacy-peer-deps 已运行
□ node_modules 目录存在 (570+ 个包)

数据库初始化
□ npm run db:push 成功运行
□ npm run db:seed 成功运行
□ Prisma Studio 可以访问 (npm run db:studio)

开发服务器
□ npm run dev 成功启动
□ 访问 http://localhost:3000 成功
□ 访问 http://localhost:3000/app 成功
□ 访问 http://localhost:3000/admin 成功

应用功能
□ 可以查看服务列表
□ 可以尝试注册用户
□ 管理后台可以访问
□ 支付政策页面可以加载
```

---

## 🔧 有用的命令

```bash
# 查看 Docker 容器
docker-compose ps

# 查看 PostgreSQL 日志
docker-compose logs postgres

# 进入 PostgreSQL 容器
docker-compose exec postgres psql -U youfujia_user -d youfujia

# 重新生成 Prisma Client
npx prisma generate

# 打开 Prisma Studio
npm run db:studio

# 重置数据库 (⚠️ 删除所有数据!)
npx prisma migrate reset

# 查看数据库中的所有表
docker-compose exec postgres psql -U youfujia_user -d youfujia -c "\dt"

# 查看特定表的数据
docker-compose exec postgres psql -U youfujia_user -d youfujia -c "SELECT * FROM \"User\";"
```

---

## 📞 获取帮助

### 检查服务器日志

运行 `npm run dev` 后，查看输出以寻找错误：

```bash
npm run dev 2>&1 | grep -i error
```

### 检查浏览器控制台

1. 打开浏览器 (Chrome/Firefox)
2. 按 F12 打开开发者工具
3. 点击 "Console" 标签
4. 查找红色错误信息

### 检查网络请求

1. 在开发者工具中点击 "Network" 标签
2. 刷新页面
3. 查找失败的请求 (红色)
4. 点击请求查看详细信息

### 查看数据库

```bash
npm run db:studio
```

然后访问 http://localhost:5555 在图形界面中查看所有数据。

---

## ⚠️ 常见错误恢复

### 一切都坏了 - 完全重置

```bash
# 1. 停止所有服务
npm run dev  # 按 Ctrl+C
docker-compose down

# 2. 清理文件
rm -rf .next node_modules prisma/dev.db

# 3. 重新开始
npm install --legacy-peer-deps
docker-compose up -d
npm run db:push
npm run db:seed
npm run dev
```

### 数据库坏了 - 重置数据库

```bash
# ⚠️ 这会删除所有数据!

# 方案 A：使用 Prisma 迁移重置
npx prisma migrate reset

# 方案 B：使用 Docker 重置
docker-compose down -v  # 删除卷
docker-compose up -d    # 重新创建
npm run db:push
npm run db:seed
```

### 看不到最新代码 - 清理缓存

```bash
rm -rf .next
npm run dev
```

---

## 📋 更多帮助

- 📖 **TEST_READY.md** - 项目就绪说明
- 🚀 **LOCAL_TESTING.md** - 完整的本地测试指南
- 📚 **README.md** - 项目总体概览
- 💬 **查看项目文档中的 FAQ 部分**

---

**如果问题仍未解决，请：**
1. 检查所有日志 (服务器 + 浏览器 + Docker)
2. 尝试完全重置 (见上方)
3. 确保所有前置要求都已满足 (Docker, Node 18+, npm)
4. 查阅项目文档中的完整故障排查部分

**祝测试顺利！** 🚀
