'use client';

import { useRef } from 'react';
import { CATEGORIES } from '@/lib/mockData';

interface CategoryTabBarProps {
  active: string;
  onChange: (cat: string) => void;
}

export default function CategoryTabBar({ active, onChange }: CategoryTabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <nav
      aria-label="新闻分类"
      className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary shadow-sm"
    >
      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 px-3 py-2.5 overflow-x-auto scrollbar-hide"
      >
        {CATEGORIES.map((cat) => {
          const isActive = active === cat;
          return (
            <button
              key={cat}
              onClick={() => onChange(cat)}
              aria-pressed={isActive}
              aria-label={`分类: ${cat}`}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#7c3aed] text-white shadow-sm'
                  : 'text-text-secondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
