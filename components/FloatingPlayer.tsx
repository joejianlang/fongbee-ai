'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronUp, ExternalLink } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';

// ── helpers ──────────────────────────────────────────────────────────────────

function extractVideoId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

// ── FloatingPlayer ────────────────────────────────────────────────────────────

export function FloatingPlayer() {
  const { activeArticle: a, closePlayer } = usePlayer();
  const [tab, setTab] = useState<'summary' | 'insight'>('summary');

  if (!a) return null;

  const videoId = a.sourceType === 'YOUTUBE' ? extractVideoId(a.sourceUrl) : null;
  const hasSummary = !!(a.summaryZh || a.summary);

  return (
    <div
      className="sticky z-30 bg-white dark:bg-[#2d2d30] border-b border-border-primary shadow-md"
      style={{ top: 'calc(var(--header-h, 56px) + 44px)' }}
    >
      {/* ── Media ── */}
      {videoId ? (
        <div className="w-full aspect-video bg-black">
          <iframe
            key={a.id}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&playsinline=1`}
            title={a.titleZh || a.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      ) : a.imageUrl ? (
        <div className="w-full aspect-video relative bg-gray-100 dark:bg-gray-800">
          <Image
            src={a.imageUrl}
            alt={a.titleZh || a.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}

      {/* ── Meta row ── */}
      <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5 text-xs flex-wrap min-w-0">
          {a.sourceId ? (
            <Link
              href={`/news/source/${a.sourceId}`}
              className="text-[#0d9488] dark:text-[#2dd4bf] font-semibold uppercase truncate tracking-wide hover:underline"
            >
              {a.sourceName}
            </Link>
          ) : (
            <span className="text-[#0d9488] dark:text-[#2dd4bf] font-semibold uppercase truncate tracking-wide">
              {a.sourceName}
            </span>
          )}
          {a.category && (
            <>
              <span className="text-text-muted">·</span>
              <span className="text-text-muted">{a.category}</span>
            </>
          )}
          <span className="text-text-muted">·</span>
          <span className="text-text-muted flex-shrink-0">{timeAgo(a.publishedAt)}</span>
        </div>
        {a.sourceId && (
          <Link
            href={`/news/source/${a.sourceId}`}
            className="text-xs px-3 py-1 rounded-full border border-[#0d9488] text-[#0d9488] hover:bg-[#0d9488]/10 transition-colors flex-shrink-0 ml-2"
          >
            + 关注
          </Link>
        )}
      </div>

      {/* ── Title ── */}
      <h2 className="text-text-primary dark:text-white text-sm font-bold leading-snug px-4 pb-2 line-clamp-2">
        {a.titleZh || a.title}
      </h2>

      {/* ── Summary tabs ── */}
      {hasSummary && (
        <>
          <div className="flex border-b border-border-primary px-4">
            <button
              onClick={() => setTab('summary')}
              className={`py-1.5 mr-6 text-xs font-medium border-b-2 transition-colors ${
                tab === 'summary'
                  ? 'border-[#0d9488] text-[#0d9488]'
                  : 'border-transparent text-text-muted'
              }`}
            >
              内容摘要
            </button>
            <button
              onClick={() => setTab('insight')}
              className={`py-1.5 text-xs font-medium border-b-2 transition-colors ${
                tab === 'insight'
                  ? 'border-[#0d9488] text-[#0d9488]'
                  : 'border-transparent text-text-muted'
              }`}
            >
              专业解读
            </button>
          </div>
          <p className="px-4 py-2.5 text-text-secondary dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
            {tab === 'summary' ? (a.summaryZh || a.summary) : '暂无专业解读'}
          </p>
        </>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border-primary">
        <button
          onClick={closePlayer}
          className="flex items-center gap-1.5 text-sm text-text-secondary border border-border-primary rounded-full px-4 py-1.5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <ChevronUp size={14} />
          收起
        </button>
        {a.sourceUrl && (
          <a
            href={a.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0d9488] dark:text-[#2dd4bf] text-sm flex items-center gap-1 hover:underline"
          >
            <ExternalLink size={13} />
            阅读原文
          </a>
        )}
      </div>
    </div>
  );
}

export default FloatingPlayer;
