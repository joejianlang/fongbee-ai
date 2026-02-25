/**
 * Supabase Storage 客户端
 *
 * ⚠️  数据主权: 必须配置 Canada Region (ca-central-1) Supabase 项目
 *     NEXT_PUBLIC_SUPABASE_URL 必须是加拿大 Supabase 实例
 *
 * 用途:
 * - PAD 协议 PDF 上传/下载
 * - 合同文件管理
 * - 用户头像
 */

import { createClient } from '@supabase/supabase-js';

// ── Supabase 客户端 ───────────────────────────────────────────────────────────

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL 未设置');
  return url;
}

// 公开客户端（浏览器端，受 RLS 限制）
export function createPublicClient() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY 未设置');
  return createClient(getSupabaseUrl(), anonKey);
}

// 服务端客户端（服务器专用，绕过 RLS）
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY 未设置');
  return createClient(getSupabaseUrl(), serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── Bucket 常量 ───────────────────────────────────────────────────────────────

export const BUCKETS = {
  PAD_AGREEMENTS: process.env.SUPABASE_STORAGE_BUCKET_PAD ?? 'pad-agreements',
  CONTRACTS: process.env.SUPABASE_STORAGE_BUCKET_CONTRACTS ?? 'contracts',
  AVATARS: process.env.SUPABASE_STORAGE_BUCKET_AVATARS ?? 'avatars',
} as const;

// ── PAD 协议 PDF ──────────────────────────────────────────────────────────────

/**
 * 上传 PAD 协议 PDF
 *
 * 存储路径: pad-agreements/{userId}/{padAuthId}.pdf
 *
 * @param userId    用户 ID
 * @param padAuthId PAD 授权 ID
 * @param pdfBuffer PDF 文件内容
 * @returns 文件 URL（私有，需要签名访问）
 */
export async function uploadPadAgreement(
  userId: string,
  padAuthId: string,
  pdfBuffer: Buffer
): Promise<{ url: string; path: string }> {
  const supabase = createServiceClient();
  const path = `${userId}/${padAuthId}.pdf`;

  const { error } = await supabase.storage
    .from(BUCKETS.PAD_AGREEMENTS)
    .upload(path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) throw new Error(`PAD 协议上传失败: ${error.message}`);

  // 生成签名 URL（有效期 24 小时）
  const { data: signedUrl, error: signError } = await supabase.storage
    .from(BUCKETS.PAD_AGREEMENTS)
    .createSignedUrl(path, 86400);

  if (signError || !signedUrl) throw new Error(`生成 PAD 协议 URL 失败: ${signError?.message}`);

  return { url: signedUrl.signedUrl, path };
}

/**
 * 获取 PAD 协议签名 URL（有效期 1 小时）
 */
export async function getPadAgreementUrl(
  userId: string,
  padAuthId: string,
  expiresInSeconds = 3600
): Promise<string> {
  const supabase = createServiceClient();
  const path = `${userId}/${padAuthId}.pdf`;

  const { data, error } = await supabase.storage
    .from(BUCKETS.PAD_AGREEMENTS)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) throw new Error(`生成 URL 失败: ${error?.message}`);
  return data.signedUrl;
}

// ── 用户头像 ──────────────────────────────────────────────────────────────────

/**
 * 上传用户头像
 *
 * 存储路径: avatars/{userId}/avatar.{ext}
 * @returns 公开 URL
 */
export async function uploadAvatar(
  userId: string,
  file: File | Buffer,
  mimeType: string
): Promise<string> {
  const supabase = createServiceClient();
  const ext = mimeType.split('/')[1] ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const fileContent = file instanceof File ? await file.arrayBuffer() : file;

  const { error } = await supabase.storage
    .from(BUCKETS.AVATARS)
    .upload(path, fileContent, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw new Error(`头像上传失败: ${error.message}`);

  const { data } = supabase.storage.from(BUCKETS.AVATARS).getPublicUrl(path);
  return data.publicUrl;
}

// ── 合同文件 ──────────────────────────────────────────────────────────────────

/**
 * 上传合同 PDF
 *
 * 存储路径: contracts/{projectId}/{contractVersionId}.pdf
 */
export async function uploadContractPdf(
  projectId: string,
  contractVersionId: string,
  pdfBuffer: Buffer
): Promise<{ url: string; path: string }> {
  const supabase = createServiceClient();
  const path = `${projectId}/${contractVersionId}.pdf`;

  const { error } = await supabase.storage
    .from(BUCKETS.CONTRACTS)
    .upload(path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) throw new Error(`合同 PDF 上传失败: ${error.message}`);

  const { data: signedUrl, error: signError } = await supabase.storage
    .from(BUCKETS.CONTRACTS)
    .createSignedUrl(path, 86400 * 7); // 7 天有效期

  if (signError || !signedUrl) throw new Error(`生成合同 URL 失败: ${signError?.message}`);

  return { url: signedUrl.signedUrl, path };
}
