-- ============================================================
-- 001_pgvector_setup.sql
-- 在 Supabase SQL Editor 中执行此脚本
-- 只需执行一次（生产环境迁移）
-- ============================================================

-- Step 1: 启用 pgvector 扩展（Supabase 内置，无需额外安装）
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: 给 article_embeddings 表添加真实向量列
--   text-embedding-3-small = 1536 维
ALTER TABLE article_embeddings
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Step 3: 从现有 vectorJson 列迁移数据
UPDATE article_embeddings
SET embedding = vectorJson::vector
WHERE vectorJson IS NOT NULL
  AND embedding IS NULL;

-- Step 4: 创建 HNSW 索引（推荐，比 IVFFlat 更快，Supabase 支持）
--   m=16, ef_construction=64 适合百万级文章
CREATE INDEX IF NOT EXISTS article_embeddings_hnsw_idx
  ON article_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Step 5: 创建相似文章查询函数（供 API 调用）
CREATE OR REPLACE FUNCTION search_similar_articles(
  query_embedding vector(1536),
  match_count     int     DEFAULT 10,
  min_similarity  float   DEFAULT 0.7
)
RETURNS TABLE (
  id              text,
  title           text,
  summary_zh      text,
  "imageUrl"      text,
  "sourceUrl"     text,
  "publishedAt"   timestamptz,
  "frontendCategory" text,
  similarity      float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    a.id,
    a.title,
    a."summaryZh",
    a."imageUrl",
    a."sourceUrl",
    a."publishedAt",
    a."frontendCategory",
    1 - (ae.embedding <=> query_embedding) AS similarity
  FROM article_embeddings ae
  JOIN articles a ON a.id = ae."articleId"
  WHERE
    a."isActive" = true
    AND ae.embedding IS NOT NULL
    AND 1 - (ae.embedding <=> query_embedding) >= min_similarity
  ORDER BY ae.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 验证
-- SELECT COUNT(*) FROM article_embeddings WHERE embedding IS NOT NULL;
-- SELECT * FROM search_similar_articles('[0.1, 0.2, ...]'::vector, 5, 0.6);
