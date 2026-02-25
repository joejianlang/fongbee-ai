'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader } from 'lucide-react';
import CategoryTabBar from '@/components/CategoryTabBar';
import { ArticleCard } from '@/components/ArticleCard';
import { MOCK_ARTICLES, filterMockArticles } from '@/lib/mockData';
import type { MockArticle } from '@/lib/mockData';

export default function FeedPage() {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [articles, setArticles]             = useState<MockArticle[]>([]);
  const [loading, setLoading]               = useState(true);
  const [page, setPage]                     = useState(1);
  const [hasMore, setHasMore]               = useState(true);

  const PAGE_SIZE = 10;

  const fetchFeed = useCallback(async (category: string, currentPage: number) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/feed?page=${currentPage}&limit=${PAGE_SIZE}`);
      const data = await res.json();

      if (data.success && data.data?.items?.length > 0) {
        const items = data.data.items as MockArticle[];
        setArticles((prev) => (currentPage === 1 ? items : [...prev, ...items]));
        setHasMore(items.length === PAGE_SIZE);
      } else {
        // DB 为空时 fallback 到 Mock 数据
        const filtered = filterMockArticles(category);
        const start    = (currentPage - 1) * PAGE_SIZE;
        const chunk    = filtered.slice(start, start + PAGE_SIZE);
        setArticles((prev) => (currentPage === 1 ? chunk : [...prev, ...chunk]));
        setHasMore(start + PAGE_SIZE < filtered.length);
      }
    } catch {
      // 网络错误也 fallback Mock
      const filtered = filterMockArticles(category);
      setArticles(filtered.slice(0, PAGE_SIZE));
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  /* 切换分类时重置 */
  useEffect(() => {
    setPage(1);
    setArticles([]);
    fetchFeed(activeCategory, 1);
  }, [activeCategory, fetchFeed]);

  /* 加载更多 */
  useEffect(() => {
    if (page === 1) return;
    fetchFeed(activeCategory, page);
  }, [page, activeCategory, fetchFeed]);

  const handleCategoryChange = (cat: string) => {
    if (cat === activeCategory) return;
    setActiveCategory(cat);
  };

  return (
    <>
      {/* 分类 Tab */}
      <CategoryTabBar active={activeCategory} onChange={handleCategoryChange} />

      {/* 文章列表 */}
      <div className="mt-2 md:mt-0 md:bg-white dark:md:bg-[#2d2d30] md:rounded-lg md:overflow-hidden md:shadow-sm">
        {loading && articles.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin text-[#0d9488]" size={28} />
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <p className="text-base">暂无内容</p>
            <p className="text-sm mt-1">换个分类试试？</p>
          </div>
        ) : (
          <div className="md:divide-y md:divide-border-primary">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {/* 加载更多 */}
        {!loading && hasMore && articles.length > 0 && (
          <div className="flex justify-center py-5">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-6 py-2 text-sm text-[#0d9488] border border-[#0d9488] rounded-full hover:bg-[#0d9488] hover:text-white transition-colors font-medium"
            >
              加载更多
            </button>
          </div>
        )}

        {/* 底部加载指示 */}
        {loading && articles.length > 0 && (
          <div className="flex justify-center py-5">
            <Loader className="animate-spin text-[#0d9488]" size={20} />
          </div>
        )}

        {/* 没有更多了 */}
        {!loading && !hasMore && articles.length > 0 && (
          <p className="text-center text-text-muted text-xs py-5">
            — 已显示全部内容 —
          </p>
        )}
      </div>
    </>
  );
}
