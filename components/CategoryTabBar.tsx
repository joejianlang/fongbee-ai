'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '@/lib/mockData';

interface NewsCategory {
  id: string;
  name: string;
}

interface CategoryTabBarProps {
  active: string;
  onChange: (cat: string) => void;
}

export default function CategoryTabBar({ active, onChange }: CategoryTabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const handleCategoryClick = (catName: string) => {
    onChange(catName);
  };

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/news-categories');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data);
        } else {
          setCategories(CATEGORIES.map((name) => ({ id: name, name })));
        }
      } catch {
        setCategories(CATEGORIES.map((name) => ({ id: name, name })));
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, loading]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 200 : -200, behavior: 'smooth' });
  };

  const displayCategories = categories.length > 0 ? categories : CATEGORIES.map((name) => ({ id: name, name }));

  const arrowBtn = 'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-border-primary bg-white dark:bg-[#2d2d30] shadow-sm text-text-secondary hover:text-text-primary transition-colors';

  return (
    <nav
      aria-label="新闻分类"
      spellCheck={false}
      className="sticky z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary shadow-sm"
      style={{ top: 'var(--header-h, 56px)' }}
    >
      <div className="flex items-center gap-1.5 px-2 py-2">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          aria-label="向左滚动"
          className={`${arrowBtn} ${showLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Scrollable chips */}
        <div
          ref={scrollRef}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide"
        >
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-20 h-8 rounded-full bg-gray-100 dark:bg-white/10 animate-pulse" />
              ))
            : displayCategories.map((cat) => {
                const isActive = active === cat.name;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.name)}
                    aria-pressed={isActive}
                    aria-label={`分类: ${cat.name}`}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[#0d9488] text-white'
                        : 'bg-gray-100 dark:bg-white/15 text-text-primary dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/25'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          aria-label="向右滚动"
          className={`${arrowBtn} ${showRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
