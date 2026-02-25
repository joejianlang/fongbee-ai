'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, Play } from 'lucide-react';
import type { MockArticle } from '@/lib/mockData';

interface ArticleCardProps {
  article: MockArticle;
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isYoutube = article.sourceType === 'YOUTUBE';

  return (
    <article className="bg-white dark:bg-[#2d2d30] rounded-xl md:rounded-none md:border-b md:border-border-primary last:border-0 mx-3 md:mx-0 mb-2.5 md:mb-0 shadow-sm md:shadow-none overflow-hidden">
      <div className="flex gap-3 p-3 md:py-4 md:px-0">

        {/* ── 缩略图 ── */}
        <div className="flex-shrink-0 relative">
          <div className="w-24 h-24 md:w-[110px] md:h-[80px] rounded-lg md:rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
            {article.imageUrl ? (
              <Image
                src={article.imageUrl}
                alt={`${article.sourceName} - ${article.title}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 96px, 110px"
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
          <div className="flex items-center gap-1 text-xs text-text-muted flex-wrap mb-1">
            <span className="text-[#0d9488] dark:text-[#2dd4bf] font-semibold max-w-[110px] truncate">
              {article.sourceName}
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted">{article.category}</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted flex-shrink-0">{timeAgo(article.publishedAt)}</span>
          </div>

          {/* 标题 */}
          <h2 className="text-text-primary dark:text-white text-sm font-semibold leading-snug line-clamp-2 mb-2">
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
