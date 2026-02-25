-- ═══════════════════════════════════════════════════════════════════════════
-- 优服佳 — Supabase Canada Region (ca-central-1) RLS 策略
--
-- 用途: Row Level Security (行级安全) 满足 CPPA/PIPEDA 数据隔离要求
-- 执行方式:
--   Supabase Dashboard → SQL Editor → 粘贴并运行
--   或: supabase db push (使用 supabase CLI)
--
-- ⚠️  重要: 必须在 Supabase Canada Region (ca-central-1) 项目中执行
-- ⚠️  执行前确保已运行 prisma db push 创建了所有表
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 前置: 创建 auth 辅助函数 ─────────────────────────────────────────────────

-- 获取当前用户 ID（从 JWT claim）
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS text AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  );
$$ LANGUAGE sql STABLE;

-- 获取当前用户角色
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS text AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    'CUSTOMER'
  );
$$ LANGUAGE sql STABLE;

-- 是否为管理员
CREATE OR REPLACE FUNCTION auth.is_admin() RETURNS boolean AS $$
  SELECT auth.user_role() = 'ADMIN';
$$ LANGUAGE sql STABLE;

-- ── 1. users 表 ───────────────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 用户只能查看/修改自己的记录；管理员可查看所有
CREATE POLICY users_select ON users
  FOR SELECT USING (
    id = auth.user_id() OR auth.is_admin()
  );

CREATE POLICY users_update ON users
  FOR UPDATE USING (id = auth.user_id())
  WITH CHECK (id = auth.user_id());

-- 服务：注册时插入
CREATE POLICY users_insert ON users
  FOR INSERT WITH CHECK (true); -- 由应用层控制，此处放开

-- 管理员可以软删除/匿名化
CREATE POLICY users_delete_admin ON users
  FOR DELETE USING (auth.is_admin());

-- ── 2. passkeys 表 ────────────────────────────────────────────────────────────

ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;

-- 只有本人可查看/管理自己的 Passkeys
CREATE POLICY passkeys_own ON passkeys
  FOR ALL USING (user_id = auth.user_id());

-- 管理员查看所有
CREATE POLICY passkeys_admin ON passkeys
  FOR SELECT USING (auth.is_admin());

-- ── 3. orders 表 ──────────────────────────────────────────────────────────────

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 客户可查看自己的订单，服务商可查看分配给自己的订单
CREATE POLICY orders_customer ON orders
  FOR SELECT USING (customer_id = auth.user_id());

CREATE POLICY orders_provider ON orders
  FOR SELECT USING (
    service_provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.user_id()
    )
  );

-- 管理员全权限
CREATE POLICY orders_admin ON orders
  FOR ALL USING (auth.is_admin());

-- ── 4. payments 表 ────────────────────────────────────────────────────────────

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 通过 order 关联判断访问权限
CREATE POLICY payments_via_order ON payments
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id = auth.user_id()
         OR service_provider_id IN (
           SELECT id FROM service_providers WHERE user_id = auth.user_id()
         )
    )
  );

CREATE POLICY payments_admin ON payments
  FOR ALL USING (auth.is_admin());

-- ── 5. service_providers 表 ───────────────────────────────────────────────────

ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;

-- 所有人可查看服务商（公开信息）
CREATE POLICY service_providers_select ON service_providers
  FOR SELECT USING (true);

-- 服务商只能修改自己的档案
CREATE POLICY service_providers_update ON service_providers
  FOR UPDATE USING (user_id = auth.user_id())
  WITH CHECK (user_id = auth.user_id());

CREATE POLICY service_providers_admin ON service_providers
  FOR ALL USING (auth.is_admin());

-- ── 6. services 表 ────────────────────────────────────────────────────────────

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 所有人可查看上架服务
CREATE POLICY services_select ON services
  FOR SELECT USING (is_available = true OR service_provider_id IN (
    SELECT id FROM service_providers WHERE user_id = auth.user_id()
  ));

-- 服务商只能管理自己的服务
CREATE POLICY services_manage ON services
  FOR ALL USING (
    service_provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.user_id()
    )
  );

CREATE POLICY services_admin ON services
  FOR ALL USING (auth.is_admin());

-- ── 7. posts 表 ───────────────────────────────────────────────────────────────

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 所有已批准帖子公开可见
CREATE POLICY posts_select ON posts
  FOR SELECT USING (is_approved = true OR author_id = auth.user_id() OR auth.is_admin());

-- 本人可发帖和修改
CREATE POLICY posts_insert ON posts
  FOR INSERT WITH CHECK (author_id = auth.user_id());

CREATE POLICY posts_update ON posts
  FOR UPDATE USING (author_id = auth.user_id())
  WITH CHECK (author_id = auth.user_id());

-- 管理员可以审核/删除
CREATE POLICY posts_admin ON posts
  FOR ALL USING (auth.is_admin());

-- ── 8. notifications 表 ───────────────────────────────────────────────────────

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 只有本人可查看自己的通知
CREATE POLICY notifications_own ON notifications
  FOR ALL USING (user_id = auth.user_id());

CREATE POLICY notifications_admin ON notifications
  FOR SELECT USING (auth.is_admin());

-- ── 9. data_deletion_requests 表 (CPPA 被遗忘权) ─────────────────────────────

ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- 本人可提交和查看自己的删除申请
CREATE POLICY deletion_requests_own ON data_deletion_requests
  FOR ALL USING (user_id = auth.user_id());

-- 管理员可查看所有（处理申请）
CREATE POLICY deletion_requests_admin ON data_deletion_requests
  FOR ALL USING (auth.is_admin());

-- ── 10. ai_decision_logs 表 (CPPA 算法透明度) ────────────────────────────────

ALTER TABLE ai_decision_logs ENABLE ROW LEVEL SECURITY;

-- 用户可查看影响自己的 AI 决策
CREATE POLICY ai_decision_logs_own ON ai_decision_logs
  FOR SELECT USING (user_id = auth.user_id() OR user_id IS NULL);

-- 管理员全权限
CREATE POLICY ai_decision_logs_admin ON ai_decision_logs
  FOR ALL USING (auth.is_admin());

-- ── 11. ai_usage_quotas 表 ────────────────────────────────────────────────────

ALTER TABLE ai_usage_quotas ENABLE ROW LEVEL SECURITY;

-- 本人可查看自己的配额
CREATE POLICY ai_usage_quotas_own ON ai_usage_quotas
  FOR SELECT USING (user_id = auth.user_id());

-- 系统（服务角色）可以更新配额
CREATE POLICY ai_usage_quotas_service ON ai_usage_quotas
  FOR ALL USING (auth.is_admin()); -- 应用层使用 SERVICE_ROLE_KEY

-- ── 12. pad_authorizations 表 (PAD 协议 — 高度敏感) ─────────────────────────

ALTER TABLE pad_authorizations ENABLE ROW LEVEL SECURITY;

-- 本人只可查看自己的 PAD 授权
CREATE POLICY pad_auth_own ON pad_authorizations
  FOR SELECT USING (user_id = auth.user_id());

-- 插入由应用层控制（需要用户明确同意）
CREATE POLICY pad_auth_insert ON pad_authorizations
  FOR INSERT WITH CHECK (user_id = auth.user_id());

-- 管理员全权限
CREATE POLICY pad_auth_admin ON pad_authorizations
  FOR ALL USING (auth.is_admin());

-- ── 13. contracts / contract_versions / contract_signatures ───────────────────

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;

-- 合同相关方（客户 + 服务商）均可查看
CREATE POLICY contracts_parties ON contracts
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects
      WHERE customer_id = auth.user_id()
         OR service_provider_id IN (
           SELECT id FROM service_providers WHERE user_id = auth.user_id()
         )
    )
  );

CREATE POLICY contract_versions_parties ON contract_versions
  FOR SELECT USING (
    contract_id IN (
      SELECT c.id FROM contracts c
      JOIN projects p ON p.id = c.project_id
      WHERE p.customer_id = auth.user_id()
         OR p.service_provider_id IN (
           SELECT id FROM service_providers WHERE user_id = auth.user_id()
         )
    )
  );

-- 编辑合同（只有相关方）
CREATE POLICY contract_versions_edit ON contract_versions
  FOR INSERT WITH CHECK (editor_id = auth.user_id());

-- 签署合同（只有签署人）
CREATE POLICY contract_signatures_sign ON contract_signatures
  FOR INSERT WITH CHECK (signer_id = auth.user_id());

CREATE POLICY contract_signatures_view ON contract_signatures
  FOR SELECT USING (
    contract_version_id IN (
      SELECT cv.id FROM contract_versions cv
      JOIN contracts c ON c.id = cv.contract_id
      JOIN projects p ON p.id = c.project_id
      WHERE p.customer_id = auth.user_id()
         OR p.service_provider_id IN (
           SELECT id FROM service_providers WHERE user_id = auth.user_id()
         )
    )
  );

-- ── 完成 ─────────────────────────────────────────────────────────────────────
-- 验证: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
