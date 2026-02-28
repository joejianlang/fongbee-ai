'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, Play } from 'lucide-react';
import type { MockArticle } from '@/lib/mockData';

interface ArticleCardProps {
  article: MockArticle;
  layout?: 'compact' | 'full';
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

export function ArticleCard({ article, layout = 'compact' }: ArticleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isYoutube = article.sourceType === 'YOUTUBE';

  /* ── Full-width layout ── */
  if (layout === 'full') {
    return (
      <article className="bg-white dark:bg-[#2d2d30] rounded-xl mx-3 md:mx-0 mb-3 md:mb-0 md:rounded-none md:border-b md:border-border-primary last:border-0 shadow-sm md:shadow-none overflow-hidden">
        {/* meta 行 */}
        <div className="flex items-center gap-1 text-xs px-3 pt-3 pb-2">
          <span className="text-[#0d9488] dark:text-[#2dd4bf] font-semibold uppercase truncate max-w-[60%]">
            {article.sourceName}
          </span>
          <span className="text-text-muted">·</span>
          <span className="text-text-muted flex-shrink-0">{timeAgo(article.publishedAt)}</span>
        </div>

        {/* 全宽图片 / 视频封面 */}
        <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-700">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt={`${article.sourceName} - ${article.title}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-xs">无图片</span>
            </div>
          )}
          {/* YouTube 居中大播放按钮 */}
          {isYoutube && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <div className="w-0 h-0 border-t-[11px] border-t-transparent border-l-[20px] border-l-red-600 border-b-[11px] border-b-transparent ml-1.5" />
              </div>
            </div>
          )}
        </div>

        {/* 标题 + 展开按钮 */}
        <div className="px-3 pt-2.5 pb-3">
          <h2 className="text-text-primary dark:text-white text-sm font-semibold leading-snug line-clamp-2 mb-2">
            {article.title}
          </h2>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-0.5 text-[#0d9488] dark:text-[#2dd4bf] text-xs font-medium hover:opacity-75 transition-opacity"
            aria-expanded={expanded}
            aria-label={expanded ? '收起' : (isYoutube ? '视频摘要' : '详情')}
          >
            {isYoutube ? '视频摘要' : '详情'}
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* 展开内容 */}
        {expanded && article.summary && (
          <div className="px-3 pb-3 border-t border-border-primary">
            <p className="text-text-secondary dark:text-gray-300 text-sm leading-relaxed pt-2.5">
              {article.summary}
            </p>
          </div>
        )}
      </article>
    );
  }

  /* ── Compact layout (default) ── */
  return (
    <article className="bg-white dark:bg-[#2d2d30] rounded-xl md:rounded-none md:border-b md:border-border-primary last:border-0 mx-3 md:mx-0 mb-3 md:mb-0 shadow-sm md:shadow-none overflow-hidden">
      <div className="flex gap-4 p-4 md:py-5 md:px-0">

        {/* ── 缩略图 ── */}
        <div className="flex-shrink-0 relative">
          <div className="w-32 h-24 md:w-[200px] md:h-[130px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
            {article.imageUrl ? (
              <Image
                src={article.imageUrl}
                alt={`${article.sourceName} - ${article.title}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 128px, 200px"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 text-xs">无图片</span>
              </div>
            )}
          </div>
          {/* YouTube 角标 */}
          {isYoutube && (
            <div className="absolute bottom-1 left-1 bg-red-600 rounded-sm px-1 py-0.5 flex items-center gap-0.5">
              <Play size={8} fill="white" className="text-white" />
              <span className="text-white text-[9px] font-bold leading-none">YT</span>
            </div>
          )}
        </div>

        {/* ── 内容区 ── */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* meta 行：来源 · 分类 · 时间 */}
          <div className="flex items-center gap-1 text-xs text-text-muted flex-wrap mb-1.5">
            <span className="text-[#0d9488] dark:text-[#2dd4bf] font-semibold max-w-[120px] truncate uppercase tracking-wide">
              {article.sourceName}
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted">{article.category}</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted flex-shrink-0">{timeAgo(article.publishedAt)}</span>
          </div>

          {/* 标题 */}
          <h2 className="text-text-primary dark:text-white text-[15px] font-semibold leading-snug line-clamp-2 mb-2">
            {article.title}
          </h2>

          {/* 详情按钮 */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-0.5 text-[#0d9488] dark:text-[#2dd4bf] text-xs font-medium hover:opacity-75 transition-opacity self-start"
            aria-expanded={expanded}
            aria-label={expanded ? '收起详情' : '查看详情'}
          >
            详情
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* ── 展开内容 ── */}
      {expanded && article.summary && (
        <div className="px-3 pb-3 md:px-0 border-t border-border-primary">
          <p className="text-text-secondary dark:text-gray-300 text-sm leading-relaxed pt-2.5">
            {article.summary}
          </p>
        </div>
      )}
    </article>
  );
}

export default ArticleCard;
