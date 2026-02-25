'use client';

import { useEffect, useState } from 'react';
import { ArticleCard } from '@/components/ArticleCard';
import { Button } from '@/components/Button';
import { Loader } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  summary?: string;
  author?: string;
  publishedAt: string;
  sourceType: string;
  imageUrl?: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  shareCount: number;
  userInteraction?: any;
}

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/feed?page=${page}&limit=10`);
        const data = await response.json();

        if (data.success) {
          setArticles((prev) => (page === 1 ? data.data.items : [...prev, ...data.data.items]));
        }
      } catch (error) {
        console.error('Failed to fetch feed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [page]);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-text-primary">AI 新闻</h1>
        <p className="text-text-secondary text-sm mt-1">个性化推荐内容</p>
      </div>

      {/* Article List */}
      <div className="space-y-4">
        {articles.length === 0 && loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-text-accent" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted">暂无内容</p>
          </div>
        ) : (
          articles.map((article) => (
            <ArticleCard key={article.id} {...article} />
          ))
        )}
      </div>

      {/* Load More */}
      {!loading && articles.length > 0 && (
        <div className="flex justify-center py-4">
          <Button
            variant="secondary"
            onClick={() => setPage((p) => p + 1)}
            isLoading={loading}
          >
            加载更多
          </Button>
        </div>
      )}
    </div>
  );
}
