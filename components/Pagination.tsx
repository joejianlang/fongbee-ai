'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, limit, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);

  // Build page number list: current ±2, with "..." gaps
  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [];
    const left  = Math.max(2, page - 2);
    const right = Math.min(totalPages - 1, page + 2);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const btnBase =
    'flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-all select-none';
  const btnActive =
    `${btnBase} bg-[#0d9488] text-white shadow-sm`;
  const btnNormal =
    `${btnBase} border border-gray-200 text-gray-600 hover:border-[#0d9488] hover:text-[#0d9488] bg-white`;
  const btnDisabled =
    `${btnBase} border border-gray-100 text-gray-300 cursor-not-allowed bg-white`;
  const btnIcon =
    `${btnBase} border border-gray-200 text-gray-500 hover:border-[#0d9488] hover:text-[#0d9488] bg-white disabled:border-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed`;

  return (
    <div className="flex items-center justify-between px-1 py-3 border-t border-gray-100 mt-4">
      {/* Info */}
      <p className="text-sm text-gray-500 hidden sm:block">
        第 {start}–{end} 条，共 <span className="font-medium text-gray-700">{total}</span> 条
      </p>
      <p className="text-sm text-gray-500 sm:hidden">
        {page} / {totalPages} 页
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => onChange(1)}
          disabled={page === 1}
          className={page === 1 ? btnDisabled : btnIcon}
          aria-label="首页"
        >
          <ChevronsLeft size={15} />
        </button>

        {/* Prev */}
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className={page === 1 ? btnDisabled : btnIcon}
          aria-label="上一页"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Page numbers */}
        {getPages().map((p, idx) =>
          p === '...' ? (
            <span key={`dots-${idx}`} className="w-8 text-center text-gray-400 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={p === page ? btnActive : btnNormal}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className={page === totalPages ? btnDisabled : btnIcon}
          aria-label="下一页"
        >
          <ChevronRight size={15} />
        </button>

        {/* Last */}
        <button
          onClick={() => onChange(totalPages)}
          disabled={page === totalPages}
          className={page === totalPages ? btnDisabled : btnIcon}
          aria-label="末页"
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
}
