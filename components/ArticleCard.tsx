'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import type { MockArticle } from '@/lib/mockData';

interface ArticleCardProps {
  article: MockArticle & { sourceId?: string; summaryZh?: string; sourceUrl?: string };
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

/** YouTube iframe 的静音控制（避免重新加载视频） */
function postMute(iframe: HTMLIFrameElement | null, mute: boolean) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(
    JSON.stringify({ event: 'command', func: mute ? 'mute' : 'unMute', args: [] }),
    '*'
  );
}

// ─── YouTube 视频区块（两种 layout 共用）────────────────────────────────────
interface VideoBlockProps {
  videoId: string;
  articleId: string;
  imageUrl?: string;
  sourceName?: string;
  title: string;
  /** 宽高 className */
  sizeCls: string;
  roundedCls?: string;
}

function VideoBlock({ videoId, articleId, imageUrl, sourceName, title, sizeCls, roundedCls = 'rounded-lg' }: VideoBlockProps) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const stop = useCallback(() => {
    setPlaying(false);
    setMuted(true);
  }, []);

  const startAutoplay = useCallback(() => {
    setPlaying(true);
    setMuted(true);
    notifyPlaying(articleId);
  }, [articleId]);

  // 监听其他视频开始播放 → 停止自己
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== articleId) stop();
    };
    window.addEventListener(YT_PLAY_EVENT, handler);
    return () => window.removeEventListener(YT_PLAY_EVENT, handler);
  }, [articleId, stop]);

  // IntersectionObserver：进入屏幕中心区域自动播放，离开停止
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startAutoplay();
        } else {
          stop();
        }
      },
      {
        // 只在视口中间 50% 区域内触发（上下各裁掉 25%）
        rootMargin: '-25% 0px -25% 0px',
        threshold: 0.1,
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [startAutoplay, stop]);

  // 点击取消静音（不重新加载视频）
  const handleUnmute = (e: React.MouseEvent) => {
    e.stopPropagation();
    postMute(iframeRef.current, false);
    setMuted(false);
    notifyPlaying(articleId); // 确保其他视频停止
  };

  const iframeSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1&playsinline=1`;

  return (
    <div ref={containerRef} className={`${sizeCls} ${roundedCls} overflow-hidden bg-black relative flex-shrink-0`}>
      {playing ? (
        <>
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
          {/* 静音/取消静音按钮 */}
          <button
            onClick={handleUnmute}
            className="absolute bottom-2 right-2 z-10 bg-black/60 rounded-full p-1.5 hover:bg-black/80 transition-colors"
            aria-label={muted ? '点击取消静音' : '已开启声音'}
          >
            {muted
              ? <VolumeX size={14} className="text-white" />
              : <Volume2 size={14} className="text-white" />
            }
          </button>
        </>
      ) : (
        <>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${sourceName} - ${title}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 128px, 400px"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              <span className="text-gray-400 text-xs">无图片</span>
            </div>
          )}
          {/* 播放按钮（暗示可以手动播放） */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow">
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-red-600 border-b-[8px] border-b-transparent ml-1" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── 主组件 ────────────────────────────────────────────────────────────────
export function ArticleCard({ article, layout = 'compact' }: ArticleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isYoutube = article.sourceType === 'YOUTUBE';
  const videoId = isYoutube ? extractVideoId(article.sourceUrl) : null;

  /* ── Full-width layout ── */
  if (layout === 'full') {
    return (
      <article className="bg-white dark:bg-[#2d2d30] rounded-xl mx-3 md:mx-0 mb-3 md:mb-0 md:rounded-none md:border-b md:border-border-primary last:border-0 shadow-sm md:shadow-none overflow-hidden">
        {/* meta 行 */}
        <div className="flex items-center gap-1 text-xs px-3 pt-3 pb-2">
          <span className="max-w-[60%] truncate"><SourceLabel article={article} /></span>
          <span className="text-text-muted">·</span>
          <span className="text-text-muted flex-shrink-0">{timeAgo(article.publishedAt)}</span>
        </div>

        {/* 图片 / 视频区域 */}
        {videoId ? (
          <VideoBlock
            videoId={videoId}
            articleId={article.id}
            imageUrl={article.imageUrl}
            sourceName={article.sourceName}
            title={article.title}
            sizeCls="w-full aspect-video"
            roundedCls="rounded-none"
          />
        ) : (
          <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-700">
            {article.imageUrl ? (
              <Image
                src={article.imageUrl}
                alt={`${article.sourceName} - ${article.title}`}
                fill className="object-cover"
                sizes="(max-width: 768px) 100vw, 640px"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 text-xs">无图片</span>
              </div>
            )}
          </div>
        )}

        {/* 标题 + 展开按钮 */}
        <div className="px-3 pt-2.5 pb-3">
          <h2 className="text-text-primary dark:text-white text-sm font-semibold leading-snug line-clamp-2 mb-2">
            {article.title}
          </h2>
          {(article.summaryZh || article.summary) && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-0.5 text-[#0d9488] dark:text-[#2dd4bf] text-xs font-medium hover:opacity-75 transition-opacity"
              aria-expanded={expanded}
            >
              {isYoutube ? '视频摘要' : '详情'}
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>

        {expanded && (article.summaryZh || article.summary) && (
          <div className="px-3 pb-3 border-t border-border-primary">
            <p className="text-text-secondary dark:text-gray-300 text-sm leading-relaxed pt-2.5">
              {article.summaryZh || article.summary}
            </p>
          </div>
        )}
      </article>
    );
  }

  /* ── Compact layout ── */
  return (
    <article className="bg-white dark:bg-[#2d2d30] rounded-xl md:rounded-none md:border-b md:border-border-primary last:border-0 mx-3 md:mx-0 mb-3 md:mb-0 shadow-sm md:shadow-none overflow-hidden">
      <div className="flex gap-4 p-4 md:py-5 md:px-0">

        {/* 缩略图 / 视频 */}
        {videoId ? (
          <VideoBlock
            videoId={videoId}
            articleId={article.id}
            imageUrl={article.imageUrl}
            sourceName={article.sourceName}
            title={article.title}
            sizeCls="w-32 h-24 md:w-[200px] md:h-[130px]"
          />
        ) : (
          <div className="flex-shrink-0 w-32 h-24 md:w-[200px] md:h-[130px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
            {article.imageUrl ? (
              <Image
                src={article.imageUrl}
                alt={`${article.sourceName} - ${article.title}`}
                fill className="object-cover"
                sizes="(max-width: 768px) 128px, 200px"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 text-xs">无图片</span>
              </div>
            )}
          </div>
        )}

        {/* 内容区 */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="flex items-center gap-1 text-xs text-text-muted flex-wrap mb-1.5">
            <span className="max-w-[120px] truncate"><SourceLabel article={article} /></span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted">{article.category}</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted flex-shrink-0">{timeAgo(article.publishedAt)}</span>
          </div>

          <h2 className="text-text-primary dark:text-white text-[15px] font-semibold leading-snug line-clamp-2 mb-2">
            {article.title}
          </h2>

          {(article.summaryZh || article.summary) && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-0.5 text-[#0d9488] dark:text-[#2dd4bf] text-xs font-medium hover:opacity-75 transition-opacity self-start"
              aria-expanded={expanded}
            >
              详情
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>
      </div>

      {expanded && (article.summaryZh || article.summary) && (
        <div className="px-3 pb-3 md:px-0 border-t border-border-primary">
          <p className="text-text-secondary dark:text-gray-300 text-sm leading-relaxed pt-2.5">
            {article.summaryZh || article.summary}
          </p>
        </div>
      )}
    </article>
  );
}

export default ArticleCard;
