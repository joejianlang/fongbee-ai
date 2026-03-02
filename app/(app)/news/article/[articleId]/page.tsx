'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Heart, Share2, Bookmark, ChevronUp, ExternalLink } from 'lucide-react';

interface ArticleDetail {
  id: string;
  title: string;
  titleZh?: string | null;
  sourceName: string;
  sourceType: 'RSS' | 'YOUTUBE';
  sourceId?: string | null;
  sourceUrl?: string | null;
  category: string;
  publishedAt: string;
  imageUrl?: string | null;
  tags: string[];
  viewCount: number;
  likeCount: number;
  shareCount: number;
  summary?: string | null;
  summaryZh?: string | null;
  content?: string | null;
  fiveW1H?: string | null;
  sentiment?: string | null;
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

function extractVideoId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

interface FiveW1H {
  who?: string;
  what?: string;
  when?: string;
  where?: string;
  why?: string;
  how?: string;
}

function parseFiveW1H(raw?: string | null): FiveW1H | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FiveW1H;
  } catch {
    return null;
  }
}

const W_LABELS: { key: keyof FiveW1H; label: string; emoji: string }[] = [
  { key: 'who', label: '人物', emoji: '👤' },
  { key: 'what', label: '事件', emoji: '📌' },
  { key: 'when', label: '时间', emoji: '🕐' },
  { key: 'where', label: '地点', emoji: '📍' },
  { key: 'why', label: '原因', emoji: '💡' },
  { key: 'how', label: '经过', emoji: '🔄' },
];

export default function ArticleDetailPage({ params }: { params: { articleId: string } }) {
  const { articleId } = params;
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'analysis'>('summary');
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/articles/${articleId}`);
        const json = await res.json();
        if (json.success) setArticle(json.data as ArticleDetail);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [articleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="px-4 py-16 text-center text-text-muted">
        <p>文章未找到</p>
        <Link href="/" className="text-[#0d9488] text-sm mt-2 inline-block">返回首页</Link>
      </div>
    );
  }

  const videoId = article.sourceType === 'YOUTUBE' ? extractVideoId(article.sourceUrl) : null;
  const displayTitle = article.titleZh || article.title;
  const summaryText = article.summaryZh || article.summary;
  const fiveW1H = parseFiveW1H(article.fiveW1H);
  const hasAnalysis = fiveW1H !== null && Object.values(fiveW1H).some((v) => v && v !== 'unknown');

  return (
    <div className="pb-20">
      {/* 顶部固定区域：导航 + 视频/图片（sticky，滑动后吸顶） */}
      <div className="sticky top-14 z-30 bg-background">
        {/* 顶部导航 */}
        <div className="bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            <ArrowLeft size={18} />
            返回
          </Link>
          <span className="font-semibold text-text-primary dark:text-white text-sm truncate max-w-[55%]">
            {article.sourceName}
          </span>
          <button
            onClick={() => navigator.share?.({ title: displayTitle, url: window.location.href }).catch(() => {})}
            className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
            aria-label="分享"
          >
            <Share2 size={20} />
          </button>
        </div>

        {/* 图片 / 视频区域 */}
        {videoId ? (
          <div className="w-full aspect-video bg-black relative">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=0&enablejsapi=1`}
              title={displayTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
            {/* 在 YouTube 打开按钮（视频受限时备用） */}
            {article.sourceUrl && (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 hover:bg-black/90 text-white text-xs px-2.5 py-1.5 rounded-full transition-colors"
              >
                <ExternalLink size={11} />
                在 YouTube 打开
              </a>
            )}
          </div>
        ) : article.imageUrl ? (
          <div className="w-full aspect-video relative bg-gray-100 dark:bg-gray-700">
            <Image
              src={article.imageUrl}
              alt={displayTitle}
              fill
              className="object-cover"
              sizes="100vw"
              unoptimized
              priority
            />
          </div>
        ) : (
          <div className="w-full aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400 text-sm">无图片</span>
          </div>
        )}
      </div>

      {/* 滚动内容区域 */}
      <div className="px-4 md:px-0">
        {/* 来源 + 时间 */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted mt-3 mb-2">
          {article.sourceId ? (
            <Link href={`/news/source/${article.sourceId}`} className="text-[#0d9488] font-semibold uppercase hover:underline">
              {article.sourceName}
            </Link>
          ) : (
            <span className="text-[#0d9488] font-semibold uppercase">{article.sourceName}</span>
          )}
          <span>·</span>
          <span>{timeAgo(article.publishedAt)}</span>
          {article.category && (
            <>
              <span>·</span>
              <span>{article.category}</span>
            </>
          )}
        </div>

        {/* 标题 */}
        <h1 className="text-text-primary dark:text-white text-lg font-bold leading-snug mb-4">
          {displayTitle}
        </h1>

        {/* 互动按钮 */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border-primary">
          <button
            onClick={() => setLiked((v) => !v)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-500' : 'text-text-muted hover:text-red-400'}`}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            <span>{article.likeCount + (liked ? 1 : 0)}</span>
          </button>
          <button
            onClick={() => setBookmarked((v) => !v)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${bookmarked ? 'text-[#0d9488]' : 'text-text-muted hover:text-[#0d9488]'}`}
          >
            <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
            <span>收藏</span>
          </button>
        </div>

        {/* Tab 栏 */}
        {(summaryText || hasAnalysis) && (
          <div className="mb-4">
            <div className="flex gap-0 border-b border-border-primary mb-4">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  activeTab === 'summary'
                    ? 'border-[#0d9488] text-[#0d9488]'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                内容摘要
              </button>
              {hasAnalysis && (
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                    activeTab === 'analysis'
                      ? 'border-[#0d9488] text-[#0d9488]'
                      : 'border-transparent text-text-muted hover:text-text-primary'
                  }`}
                >
                  专业解读
                </button>
              )}
            </div>

            {/* 内容摘要 */}
            {activeTab === 'summary' && summaryText && (
              <div>
                <p className="text-text-secondary dark:text-gray-300 text-[15px] leading-relaxed">
                  {summaryText}
                </p>
                {article.content && article.content.length > 400 && (
                  <Link
                    href={article.sourceUrl ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-[#0d9488] text-sm hover:underline"
                  >
                    阅读原文 →
                  </Link>
                )}
              </div>
            )}

            {/* 专业解读 (5W1H) */}
            {activeTab === 'analysis' && fiveW1H && (
              <div className="space-y-3">
                {W_LABELS.filter(({ key }) => fiveW1H[key] && fiveW1H[key] !== 'unknown').map(({ key, label, emoji }) => (
                  <div key={key} className="flex gap-3">
                    <div className="flex-shrink-0 w-16 flex items-start gap-1 text-xs font-semibold text-text-muted pt-0.5">
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </div>
                    <p className="flex-1 text-text-secondary dark:text-gray-300 text-[14px] leading-relaxed">
                      {fiveW1H[key]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 标签 */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-text-muted"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 返回顶部 */}
        <div className="mt-8 flex justify-center pb-4">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <ChevronUp size={16} />
            收起
          </button>
        </div>
      </div>
    </div>
  );
}
