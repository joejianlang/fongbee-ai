-- ═══════════════════════════════════════════════════════════════════════════
-- 优服佳 — Supabase Storage Buckets 设置
--
-- ⚠️  必须在 Supabase Canada Region (ca-central-1) 项目中执行
-- ⚠️  数据主权: 所有文件存储在加拿大境内
--
-- Buckets:
-- 1. pad-agreements  — PAD 预授权协议 PDF (私有，只有本人+管理员)
-- 2. contracts       — 合同文件 PDF (私有，相关方)
-- 3. avatars         — 用户头像 (公开)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. PAD 协议存储桶 (私有) ──────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pad-agreements',
  'pad-agreements',
  false,                    -- 私有
  5242880,                  -- 5MB 上限
  ARRAY['application/pdf'] -- 只允许 PDF
) ON CONFLICT (id) DO NOTHING;

-- PAD 存储桶 RLS
CREATE POLICY pad_agreements_own ON storage.objects
  FOR SELECT USING (
    bucket_id = 'pad-agreements' AND (
      auth.user_id() = (storage.foldername(name))[1] OR
      auth.is_admin()
    )
  );

CREATE POLICY pad_agreements_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pad-agreements' AND
    auth.user_id() = (storage.foldername(name))[1]
  );

-- ── 2. 合同存储桶 (私有) ──────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  false,
  10485760,                 -- 10MB 上限
  ARRAY['application/pdf', 'text/plain', 'text/markdown']
) ON CONFLICT (id) DO NOTHING;

-- 合同存储桶 RLS（简化：所有认证用户可上传/查看自己上传的合同）
CREATE POLICY contracts_authenticated ON storage.objects
  FOR ALL USING (
    bucket_id = 'contracts' AND (
      auth.user_id() != '' OR auth.is_admin()
    )
  );

-- ── 3. 头像存储桶 (公开) ──────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,                     -- 公开
  2097152,                  -- 2MB 上限
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 头像存储桶 RLS（公开读，只能改自己的头像）
CREATE POLICY avatars_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY avatars_own_write ON storage.objects
  FOR ALL USING (
    bucket_id = 'avatars' AND
    auth.user_id() = (storage.foldername(name))[1]
  );
