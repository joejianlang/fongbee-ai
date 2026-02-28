/**
 * AI Processing Pipeline
 *
 * Functions:
 * - processSummary: Generate English + Chinese summary (tier1, cached)
 * - processTags: Extract 5-8 relevant tags (tier1, cached)
 * - processSentiment: Score sentiment -1 to 1 (tier1, cached)
 * - processFiveW1H: Extract 5W1H JSON (tier2, cached)
 * - processEmbedding: Generate text-embedding-3-small vector (no cache)
 * - processArticle: Full pipeline orchestration
 *
 * Every AI call tracks aiCostUsd and writes aiModelUsed to Article.
 * AI decisions affecting users are logged to AIDecisionLog (CPPA compliance).
 */

import { prisma } from '@/lib/db';
import { withSemanticCache } from '@/lib/cache/redis';
import { mapTagsToCategory } from '@/lib/ai/categoryMapper';
import {
  getOpenAIClient,
  getTierModel,
  estimateCost,
  estimateTokens,
} from '@/lib/ai/openai';

// ── Cost Constants ────────────────────────────────────────────────────────────

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_COST_PER_1K = 0.00002;

// ── Summary ───────────────────────────────────────────────────────────────────

interface SummaryResult {
  summary: string;
  summaryZh: string;
  costUsd: number;
}

export async function processSummary(
  articleId: string,
  content: string,
  language: string
): Promise<SummaryResult> {
  const model = getTierModel('tier1');
  const cacheInput = `${language}::${content.slice(0, 500)}`;

  const { result } = await withSemanticCache<SummaryResult>(
    'summary',
    cacheInput,
    async () => {
      const client = getOpenAIClient();
      const prompt = `You are a news summarizer. Given the article content below, produce:
1. A concise English summary (2-3 sentences)
2. A concise Chinese summary (2-3 sentences)

Return ONLY valid JSON in this exact format:
{"summary": "...", "summaryZh": "..."}

Article content:
${content.slice(0, 3000)}`;

      const inputTokens = estimateTokens(prompt);
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 400,
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      const outputTokens = estimateTokens(raw);
      const costUsd = estimateCost(model, inputTokens, outputTokens);

      let parsed: { summary?: string; summaryZh?: string } = {};
      try {
        parsed = JSON.parse(raw) as { summary?: string; summaryZh?: string };
      } catch {
        parsed = { summary: raw.slice(0, 500), summaryZh: '' };
      }

      return {
        summary: parsed.summary ?? '',
        summaryZh: parsed.summaryZh ?? '',
        costUsd,
      };
    }
  );

  await prisma.article.update({
    where: { id: articleId },
    data: { summary: result.summary, summaryZh: result.summaryZh },
  });

  return result;
}

// ── Tags ──────────────────────────────────────────────────────────────────────

interface TagResult {
  tag: string;
  confidence: number;
}

interface TagsResult {
  tags: TagResult[];
  costUsd: number;
}

export async function processTags(
  articleId: string,
  title: string,
  content: string
): Promise<TagsResult> {
  const model = getTierModel('tier1');
  const cacheInput = `${title}::${content.slice(0, 300)}`;

  const { result } = await withSemanticCache<TagsResult>(
    'tags',
    cacheInput,
    async () => {
      const client = getOpenAIClient();
      const prompt = `You are a content tagger. Given the article title and content, extract 5-8 relevant tags.

Return ONLY valid JSON array in this format:
[{"tag": "technology", "confidence": 0.95}, {"tag": "AI", "confidence": 0.88}]

Title: ${title}
Content: ${content.slice(0, 2000)}`;

      const inputTokens = estimateTokens(prompt);
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 300,
      });

      const raw = response.choices[0]?.message?.content ?? '[]';
      const outputTokens = estimateTokens(raw);
      const costUsd = estimateCost(model, inputTokens, outputTokens);

      let tags: TagResult[] = [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          tags = parsed.filter(
            (t): t is TagResult =>
              typeof t === 'object' && t !== null &&
              typeof (t as Record<string, unknown>).tag === 'string' &&
              typeof (t as Record<string, unknown>).confidence === 'number'
          );
        }
      } catch {
        tags = [];
      }

      return { tags, costUsd };
    }
  );

  // Upsert ArticleTag records
  await prisma.articleTag.deleteMany({ where: { articleId } });
  if (result.tags.length > 0) {
    await prisma.articleTag.createMany({
      data: result.tags.map((t) => ({
        articleId,
        tag: t.tag,
        confidence: t.confidence,
      })),
      skipDuplicates: true,
    });
  }

  return result;
}

// ── Sentiment ─────────────────────────────────────────────────────────────────

interface SentimentResult {
  score: number;
  sentiment: string;
  costUsd: number;
}

export async function processSentiment(
  articleId: string,
  title: string,
  summary: string
): Promise<SentimentResult> {
  const model = getTierModel('tier1');
  const cacheInput = `${title}::${summary.slice(0, 300)}`;

  const { result } = await withSemanticCache<SentimentResult>(
    'sentiment',
    cacheInput,
    async () => {
      const client = getOpenAIClient();
      const prompt = `Analyze the sentiment of this article. Return ONLY valid JSON:
{"score": 0.0, "sentiment": "neutral"}

where score is from -1.0 (very negative) to +1.0 (very positive),
and sentiment is one of: "positive", "negative", "neutral"

Title: ${title}
Summary: ${summary}`;

      const inputTokens = estimateTokens(prompt);
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 100,
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      const outputTokens = estimateTokens(raw);
      const costUsd = estimateCost(model, inputTokens, outputTokens);

      let parsed: { score?: number; sentiment?: string } = {};
      try {
        parsed = JSON.parse(raw) as { score?: number; sentiment?: string };
      } catch {
        parsed = { score: 0, sentiment: 'neutral' };
      }

      return {
        score: typeof parsed.score === 'number' ? parsed.score : 0,
        sentiment: parsed.sentiment ?? 'neutral',
        costUsd,
      };
    }
  );

  await prisma.article.update({
    where: { id: articleId },
    data: { sentimentScore: result.score, sentiment: result.sentiment },
  });

  return result;
}

// ── Five W1H ──────────────────────────────────────────────────────────────────

interface FiveW1HResult {
  fiveW1H: string;
  costUsd: number;
}

export async function processFiveW1H(
  articleId: string,
  content: string
): Promise<FiveW1HResult> {
  const model = getTierModel('tier2');
  const cacheInput = content.slice(0, 500);

  const { result } = await withSemanticCache<FiveW1HResult>(
    '5w1h',
    cacheInput,
    async () => {
      const client = getOpenAIClient();
      const prompt = `Extract the 5W1H from this article. Return ONLY valid JSON:
{"who": "...", "what": "...", "when": "...", "where": "...", "why": "...", "how": "..."}

Use "unknown" for any element you cannot determine from the text.

Article:
${content.slice(0, 3000)}`;

      const inputTokens = estimateTokens(prompt);
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 400,
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      const outputTokens = estimateTokens(raw);
      const costUsd = estimateCost(model, inputTokens, outputTokens);

      let fiveW1H = raw;
      try {
        JSON.parse(raw);
      } catch {
        fiveW1H = JSON.stringify({
          who: 'unknown',
          what: 'unknown',
          when: 'unknown',
          where: 'unknown',
          why: 'unknown',
          how: 'unknown',
        });
      }

      return { fiveW1H, costUsd };
    }
  );

  await prisma.article.update({
    where: { id: articleId },
    data: { fiveW1H: result.fiveW1H },
  });

  return result;
}

// ── Embedding ─────────────────────────────────────────────────────────────────

interface EmbeddingResult {
  vectorJson: string;
  costUsd: number;
}

export async function processEmbedding(
  articleId: string,
  title: string,
  summary: string
): Promise<EmbeddingResult> {
  const client = getOpenAIClient();
  const inputText = `${title} ${summary}`.slice(0, 2000);
  const inputTokens = estimateTokens(inputText);

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: inputText,
  });

  const vector = response.data[0]?.embedding ?? [];
  const vectorJson = JSON.stringify(vector);
  const costUsd = (inputTokens / 1000) * EMBEDDING_COST_PER_1K;

  // Write both vectorJson (fallback) and embedding (pgvector) if supported
  await prisma.articleEmbedding.upsert({
    where: { articleId },
    create: {
      articleId,
      vectorJson,  // 保留 JSON 兼容字段
      model: EMBEDDING_MODEL,
    },
    update: {
      vectorJson,
      model: EMBEDDING_MODEL,
    },
  });

  // pgvector raw SQL upsert（Prisma 暂不支持 vector 类型的直接赋值）
  try {
    await prisma.$executeRaw`
      UPDATE article_embeddings
      SET embedding = ${vector}::vector
      WHERE "articleId" = ${articleId}
    `;
  } catch {
    // 本地开发环境未安装 pgvector 扩展时静默忽略
  }

  return { vectorJson, costUsd };
}

// ── Full Pipeline ─────────────────────────────────────────────────────────────

interface ProcessArticleResult {
  success: boolean;
  totalCostUsd: number;
  steps: {
    summary: boolean;
    tags: boolean;
    sentiment: boolean;
    fiveW1H: boolean;
    embedding: boolean;
  };
  errors: string[];
}

export async function processArticle(
  articleId: string
): Promise<ProcessArticleResult> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { feedSource: { select: { language: true, type: true } } },
  });

  if (!article) {
    return {
      success: false,
      totalCostUsd: 0,
      steps: { summary: false, tags: false, sentiment: false, fiveW1H: false, embedding: false },
      errors: [`Article ${articleId} not found`],
    };
  }

  const language = article.feedSource?.language ?? 'en';
  let totalCostUsd = 0;
  const steps = { summary: false, tags: false, sentiment: false, fiveW1H: false, embedding: false };
  const errors: string[] = [];
  const model = getTierModel('tier1');

  // Step 1: Summary
  let summaryText = article.summary ?? '';
  try {
    const res = await processSummary(articleId, article.content, language);
    totalCostUsd += res.costUsd;
    summaryText = res.summary;
    steps.summary = true;
  } catch (err) {
    errors.push(`summary: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Step 2: Tags
  try {
    const res = await processTags(articleId, article.title, article.content);
    totalCostUsd += res.costUsd;
    steps.tags = true;
  } catch (err) {
    errors.push(`tags: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Step 3: Sentiment
  try {
    const res = await processSentiment(articleId, article.title, summaryText);
    totalCostUsd += res.costUsd;
    steps.sentiment = true;
  } catch (err) {
    errors.push(`sentiment: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Step 4: 5W1H
  try {
    const res = await processFiveW1H(articleId, article.content);
    totalCostUsd += res.costUsd;
    steps.fiveW1H = true;
  } catch (err) {
    errors.push(`5w1h: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Step 5: Embedding
  try {
    const res = await processEmbedding(articleId, article.title, summaryText);
    totalCostUsd += res.costUsd;
    steps.embedding = true;
  } catch (err) {
    errors.push(`embedding: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Step 6: Map tags → frontend category
  let frontendCategory: string | undefined;
  try {
    const tagRecords = await prisma.articleTag.findMany({
      where: { articleId },
      select: { tag: true },
    });
    const tagStrings = tagRecords.map((t) => t.tag);
    frontendCategory = mapTagsToCategory(tagStrings, article.feedSource?.type);
    steps.tags = steps.tags; // already set above
  } catch (err) {
    errors.push(`categoryMapping: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Update Article with processing metadata + category
  await prisma.article.update({
    where: { id: articleId },
    data: {
      aiProcessedAt: new Date(),
      aiModelUsed: model,
      aiCostUsd: totalCostUsd,
      ...(frontendCategory ? { frontendCategory } : {}),
    },
  });

  // Log AI decision to AIDecisionLog (CPPA compliance - CONTENT_RECOMMENDATION)
  try {
    await prisma.aIDecisionLog.create({
      data: {
        userId: null,
        decisionType: 'CONTENT_RECOMMENDATION',
        inputSummary: `Article: ${article.title.slice(0, 100)}`,
        outputSummary: `Processed: summary=${steps.summary}, tags=${steps.tags}, sentiment=${steps.sentiment}`,
        explanation: JSON.stringify({
          en: 'Article was analyzed by AI to extract summary, tags, sentiment, 5W1H, and semantic embedding for personalized recommendations.',
          zh: '文章由AI分析提取摘要、标签、情感、5W1H和语义向量，用于个性化推荐。',
        }),
        modelUsed: model,
        costUsd: totalCostUsd,
      },
    });
  } catch (err) {
    console.warn('[Pipeline] AIDecisionLog write failed:', err);
  }

  const success = errors.length === 0;
  return { success, totalCostUsd, steps, errors };
}
