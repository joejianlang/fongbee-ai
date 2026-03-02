'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronUp, VolumeX, Share2, ExternalLink } from 'lucide-react';
import type { MockArticle } from '@/lib/mockData';

interface ArticleCardProps {
  article: MockArticle & { sourceId?: string; summaryZh?: string; sourceUrl?: string; titleZh?: string };
  layout?: 'compact' | 'full';
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

function extractVideoId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function SourceLabel({ article }: { article: ArticleCardProps['article'] }) {
  if (article.sourceId) {
    return (
      <Link
        href={`/news/source/${article.sourceId}`}
        className="text-[#0d9488] dark:text-[#2dd4bf] font-semibold uppercase truncate tracking-wide hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {article.sourceName}
      </Link>
    );
  }
  return (
    <span className="text-[#0d9488] dark:text-[#2dd4bf] font-semibold uppercase truncate tracking-wide">
      {article.sourceName}
    </span>
  );
}

/** 全局事件：通知所有卡片"某个视频开始播放了" */
const YT_PLAY_EVENT = 'yt-card-autoplay';
function notifyPlaying(articleId: string) {
  window.dispatchEvent(new CustomEvent(YT_PLAY_EVENT, { detail: articleId }));
}

// ─── YouTube 视频区块 ──────────────────────────────────────────────────────
interface VideoBlockProps {
  videoId: string;
  articleId: string;
  imageUrl?: string;
  sourceName?: string;
  title: string;
  sizeCls: string;
  roundedCls?: string;
  onExpand: () => void;
}

function VideoBlock({ videoId, articleId, imageUrl, sourceName, title, sizeCls, roundedCls = 'rounded-lg', onExpand }: VideoBlockProps) {
  const [playing, setPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const stop = useCallback(() => setPlaying(false), []);
  const startAutoplay = useCallback(() => { setPlaying(true); notifyPlaying(articleId); }, [articleId]);

  useEffect(() => {
    const handler = (e: Event) => { if ((e as CustomEvent<string>).detail !== articleId) stop(); };
    window.addEventListener(YT_PLAY_EVENT, handler);
    return () => window.removeEventListener(YT_PLAY_EVENT, handler);
  }, [articleId, stop]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { entry.isIntersecting ? startAutoplay() : stop(); },
      { rootMargin: '-25% 0px -25% 0px', threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [startAutoplay, stop]);

  const iframeSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1&playsinline=1`;
  const handleClick = (e: React.MouseEvent) => { e.stopPropagation(); onExpand(); };

  return (
    <div ref={containerRef} className={`${sizeCls} ${roundedCls} overflow-hidden bg-black relative flex-shrink-0`}>
      {playing ? (
        <div className="absolute inset-0">
          <iframe src={iframeSrc} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
          <button
            onClick={handleClick}
            className="absolute inset-0 w-full h-full z-10 flex items-end justify-end p-2"
            aria-label="展开详情"
          >
            <span className="bg-black/60 rounded-full p-1.5"><VolumeX size={14} className="text-white" /></span>
          </button>
        </div>
      ) : (
        <button className="absolute inset-0 w-full h-full" onClick={handleClick} aria-label="展开详情">
          {imageUrl ? (
            <Image src={imageUrl} alt={`${sourceName} - ${title}`} fill className="object-cover" sizes="(max-width: 768px) 128px, 400px" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              <span className="text-gray-400 text-xs">无图片</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow">
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-red-600 border-b-[8px] border-b-transparent ml-1" />
            </div>
          </div>
        </button>
      )}
    </div>
  );
}

// ── 内联展开面板 ────────────────────────────────────────────────────────────
function ExpandedPanel({
  article,
  onCollapse,
  showMedia = true,
}: {
  article: ArticleCardProps['article'];
  onCollapse: () => void;
  showMedia?: boolean;
}) {
  const [tab, setTab] = useState<'summary' | 'insight'>('summary');
  const videoId = showMedia && article.sourceType === 'YOUTUBE' ? extractVideoId(article.sourceUrl) : null;

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: article.titleZh || article.title, url: article.sourceUrl || window.location.href }).catch(() => { });
    } else {
      navigator.clipboard.writeText(article.sourceUrl || window.location.href).catch(() => { });
    }
  };

  return (
    <div className="border-t border-border-primary" onClick={(e) => e.stopPropagation()}>
      {/* 视频 / 图片 — sticky at top when expanded */}
      {showMedia && (
        videoId ? (
          <div className="sticky top-[104px] z-20 w-full aspect-video bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=0&enablejsapi=1`}
              title={article.titleZh || article.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
            {article.sourceUrl && (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 hover:bg-black/90 text-white text-xs px-2.5 py-1.5 rounded-full transition-colors"
              >
                <ExternalLink size={11} />
                在 YouTube 打开
              </a>
            )}
          </div>
        ) : article.imageUrl ? (
          <div className="sticky top-[104px] z-20 w-full aspect-video bg-gray-100 dark:bg-gray-800">
            <Image src={article.imageUrl} alt={article.titleZh || article.title} fill className="object-cover" unoptimized />
          </div>
        ) : null
      )}

      {/* 来源 + 关注按钮 */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-1.5 text-sm flex-wrap">
          <SourceLabel article={article} />
          {article.category && (
            <>
              <span className="text-text-muted">·</span>
              <span className="text-text-muted text-xs">{article.category}</span>
            </>
          )}
          <span className="text-text-muted">·</span>
          <span className="text-text-muted text-xs">{timeAgo(article.publishedAt)}</span>
        </div>
        {article.sourceId && (
          <Link
            href={`/news/source/${article.sourceId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs px-3 py-1 rounded-full border border-[#0d9488] text-[#0d9488] hover:bg-[#0d9488]/10 transition-colors flex-shrink-0 ml-2"
          >
            + 关注
          </Link>
        )}
      </div>

      {/* 标题 */}
      <h2 className="text-text-primary dark:text-white text-base font-bold leading-snug px-4 py-2">
        {article.titleZh || article.title}
      </h2>

      {/* Tabs + 内容 */}
      {(article.summaryZh || article.summary) && (
        <>
          <div className="flex border-b border-border-primary px-4">
            <button
              onClick={() => setTab('summary')}
              className={`py-2 mr-6 text-sm font-medium border-b-2 transition-colors ${tab === 'summary' ? 'border-[#0d9488] text-[#0d9488]' : 'border-transparent text-text-muted'}`}
            >
              内容摘要
            </button>
            <button
              onClick={() => setTab('insight')}
              className={`py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'insight' ? 'border-[#0d9488] text-[#0d9488]' : 'border-transparent text-text-muted'}`}
            >
              专业解读
            </button>
          </div>
          <div className="px-4 py-3">
            <p className="text-text-secondary dark:text-gray-300 text-base leading-relaxed">
              {tab === 'summary'
                ? (article.summaryZh || article.summary)
                : '暂无专业解读'}
            </p>
          </div>
        </>
      )}

      {/* 收起按钮 */}
      <div className="flex justify-center py-3 border-t border-border-primary">
        <button
          onClick={onCollapse}
          className="flex items-center gap-1.5 px-6 py-2 rounded-full border border-border-primary text-text-secondary text-sm hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <ChevronUp size={15} />
          收起
        </button>
      </div>

      {/* 阅读原文 + 分享 */}
      <div className="flex items-center justify-between px-4 pb-4 border-t border-border-primary pt-2">
        {article.sourceUrl ? (
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#0d9488] dark:text-[#2dd4bf] text-sm flex items-center gap-1 hover:underline"
          >
            阅读原文 →
          </a>
        ) : <span />}
        <button onClick={share} className="text-text-muted hover:text-text-primary transition-colors" aria-label="分享">
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── 主组件 ────────────────────────────────────────────────────────────────
export function ArticleCard({ article, layout = 'compact' }: ArticleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isYoutube = article.sourceType === 'YOUTUBE';
  const videoId = isYoutube ? extractVideoId(article.sourceUrl) : null;
  const hasSummary = !!(article.summaryZh || article.summary);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  /* ── Full-width layout ── */
  if (layout === 'full') {
    return (
      <article className={`bg-white dark:bg-[#2d2d30] rounded-xl mx-3 md:mx-0 mb-3 md:mb-0 md:rounded-none md:border-b md:border-border-primary last:border-0 shadow-sm md:shadow-none cursor-pointer ${expanded ? '' : 'overflow-hidden'}`} onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-center gap-1 text-xs px-3 pt-3 pb-2">
          <span className="max-w-[60%] truncate"><SourceLabel article={article} /></span>
          <span className="text-text-muted">·</span>
          <span className="text-text-muted flex-shrink-0">{timeAgo(article.publishedAt)}</span>
        </div>

        {videoId ? (
          <VideoBlock videoId={videoId} articleId={article.id} imageUrl={article.imageUrl} sourceName={article.sourceName} title={article.title} sizeCls="w-full aspect-video" roundedCls="rounded-none" onExpand={() => setExpanded(true)} />
        ) : (
          <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-700">
            {article.imageUrl ? (
              <Image src={article.imageUrl} alt={`${article.sourceName} - ${article.title}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 640px" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><span className="text-gray-400 text-xs">无图片</span></div>
            )}
          </div>
        )}

        <div className="px-3 pt-2.5 pb-3">
          <h2 className="text-text-primary dark:text-white text-sm font-semibold leading-snug line-clamp-2 mb-2">
            {article.titleZh || article.title}
          </h2>
          {hasSummary && (
            <button onClick={toggle} className="flex items-center gap-0.5 text-[#0d9488] dark:text-[#2dd4bf] text-xs font-medium hover:opacity-75 transition-opacity" aria-expanded={expanded}>
              {isYoutube ? '视频摘要' : '详情'}
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>

        {expanded && <ExpandedPanel article={article} onCollapse={() => setExpanded(false)} showMedia={false} />}
      </article>
    );
  }

  /* ── Compact layout ── */
  return (
    <article className={`bg-white dark:bg-[#2d2d30] rounded-xl md:rounded-none md:border-b md:border-border-primary last:border-0 mx-3 md:mx-0 mb-3 md:mb-0 shadow-sm md:shadow-none cursor-pointer ${expanded ? '' : 'overflow-hidden'}`} onClick={() => setExpanded((v) => !v)}>
      <div className="flex gap-4 p-4 md:py-5 md:px-0">

        {/* 缩略图 / 视频 */}
        {videoId ? (
          <VideoBlock videoId={videoId} articleId={article.id} imageUrl={article.imageUrl} sourceName={article.sourceName} title={article.title} sizeCls="w-32 h-24 md:w-[200px] md:h-[130px]" onExpand={() => setExpanded(true)} />
        ) : (
          <div className="flex-shrink-0 w-32 h-24 md:w-[200px] md:h-[130px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
            {article.imageUrl ? (
              <Image src={article.imageUrl} alt={`${article.sourceName} - ${article.title}`} fill className="object-cover" sizes="(max-width: 768px) 128px, 200px" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><span className="text-gray-400 text-xs">无图片</span></div>
            )}
          </div>
        )}

        {/* 内容区 */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="flex items-center gap-1 text-xs text-text-muted flex-wrap mb-1.5">
            <span className="max-w-[120px] truncate"><SourceLabel article={article} /></span>
            {article.category && (
              <>
                <span className="text-text-muted">·</span>
                <span className="text-text-muted">{article.category}</span>
              </>
            )}
            <span className="text-text-muted">·</span>
            <span className="text-text-muted flex-shrink-0">{timeAgo(article.publishedAt)}</span>
          </div>

          <h2 className="text-text-primary dark:text-white text-[15px] font-semibold leading-snug line-clamp-2 mb-2">
            {article.titleZh || article.title}
          </h2>

          {hasSummary && (
            <button
              onClick={toggle}
              className="flex items-center gap-0.5 text-[#0d9488] dark:text-[#2dd4bf] text-xs font-medium hover:opacity-75 transition-opacity self-start"
              aria-expanded={expanded}
            >
              详情
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>
      </div>

      {expanded && <ExpandedPanel article={article} onCollapse={() => setExpanded(false)} />}
    </article>
  );
}

export default ArticleCard;
