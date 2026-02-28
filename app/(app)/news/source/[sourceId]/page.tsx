'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Heart, Share2, CheckCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ArticleCard } from '@/components/ArticleCard';

interface MockArticle {
  id: string;
  title: string;
  sourceName: string;
  sourceType: 'RSS' | 'YOUTUBE';
  category: string;
  publishedAt: string;
  imageUrl?: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  shareCount: number;
  summary?: string;
}

interface NewsSourceDetail {
  id: string;
  name: string;
  type: 'RSS' | 'YOUTUBE';
  description: string;
  imageUrl?: string;
  articleCount: number;
  lastCrawledAt?: string;
  isFollowing: boolean;
}

// Mock data for news sources
const MOCK_SOURCES: Record<string, NewsSourceDetail> = {
  'national-post': {
    id: 'national-post',
    name: 'National Post',
    type: 'RSS',
    description: '加拿大领先的新闻媒体，提供深度报道和观点评论',
    imageUrl: undefined,
    articleCount: 245,
    lastCrawledAt: '2026-02-27T15:30:00Z',
    isFollowing: false,
  },
  'cnn': {
    id: 'cnn',
    name: 'CNN',
    type: 'RSS',
    description: 'CNN是美国领先的新闻频道，提供国际新闻和热点话题',
    imageUrl: undefined,
    articleCount: 523,
    lastCrawledAt: '2026-02-27T14:45:00Z',
    isFollowing: false,
  },
  'verge': {
    id: 'verge',
    name: 'The Verge',
    type: 'RSS',
    description: '专注科技、电子产品和互联网文化的新闻网站',
    imageUrl: undefined,
    articleCount: 187,
    lastCrawledAt: '2026-02-27T16:00:00Z',
    isFollowing: false,
  },
};

// Mock articles
const MOCK_ARTICLES: MockArticle[] = [
  {
    id: '1',
    title: 'Guelph 公交车司机在撞车事故后被指控',
    sourceName: 'National Post',
    sourceType: 'RSS',
    category: '本地',
    publishedAt: '2026-02-27T10:30:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=200&h=120&fit=crop',
    tags: ['本地', 'Guelph'],
    viewCount: 1234,
    likeCount: 45,
    shareCount: 12,
    summary: '当地警方正在调查一起涉及公交车的交通事故...',
  },
  {
    id: '2',
    title: 'AI 革命即将改变我们的工作方式',
    sourceName: 'The Verge',
    sourceType: 'RSS',
    category: '科技',
    publishedAt: '2026-02-26T14:15:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1677442d019cecf8d69b4b5a345e26173382ada4c?w=200&h=120&fit=crop',
    tags: ['科技', 'AI'],
    viewCount: 5678,
    likeCount: 234,
    shareCount: 89,
    summary: '专家预测人工智能将在未来十年内彻底改变职场生态...',
  },
  {
    id: '3',
    title: '特朗普宣布竞选团队人员任免',
    sourceName: 'CNN',
    sourceType: 'RSS',
    category: '政治',
    publishedAt: '2026-02-26T08:45:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1552058544-f6b08422138a?w=200&h=120&fit=crop',
    tags: ['政治', '美国'],
    viewCount: 8901,
    likeCount: 567,
    shareCount: 234,
    summary: '美国政治人物宣布了竞选团队的重要人事变动...',
  },
];

export default function NewsSourcePage({ params }: { params: { sourceId: string } }) {
  const { sourceId } = params;
  const t = useTranslations('feed');
  const tCommon = useTranslations('common');

  const [source, setSource] = useState<NewsSourceDetail | null>(null);
  const [articles, setArticles] = useState<MockArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    // 模拟加载来源和文章数据
    const sourceData = MOCK_SOURCES[sourceId];
    if (sourceData) {
      setSource(sourceData);
      setIsFollowing(sourceData.isFollowing);
      // 模拟过滤该来源的文章
      const sourceArticles = MOCK_ARTICLES.filter(
        (a) => a.sourceName === sourceData.name || a.sourceName.toLowerCase().includes(sourceId)
      );
      setArticles(sourceArticles);
    }
    setLoading(false);
  }, [sourceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-muted">{tCommon('loading')}</p>
      </div>
    );
  }

  if (!source) {
    return (
      <div className="px-4 md:px-0 py-16 text-center">
        <p className="text-text-muted">{tCommon('error')}</p>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* 顶部导航栏 */}
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm">
          <ArrowLeft size={18} />{tCommon('back')}
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">{source.name}</span>
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-text-muted hover:text-text-primary transition-colors" aria-label="分享">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 md:px-0 mt-4 space-y-4">
        {/* 来源信息卡片 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-text-primary dark:text-white">{source.name}</h1>
              <p className="text-xs text-text-muted mt-1">{source.type === 'RSS' ? 'RSS 新闻源' : 'YouTube 频道'}</p>
            </div>
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                isFollowing
                  ? 'bg-[#0d9488] text-white'
                  : 'border border-[#0d9488] text-[#0d9488] hover:bg-[#0d9488]/10'
              }`}
            >
              {isFollowing ? '已关注' : '关注'}
            </button>
          </div>

          <p className="text-sm text-text-secondary dark:text-gray-300 leading-relaxed mb-3">{source.description}</p>

          {/* 统计信息 */}
          <div className="flex items-center gap-4 text-xs text-text-muted pt-3 border-t border-border-primary">
            <div className="flex items-center gap-1">
              <CheckCircle size={14} className="text-[#0d9488]" />
              <span>{source.articleCount} 篇文章</span>
            </div>
            {source.lastCrawledAt && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>最后更新: {new Date(source.lastCrawledAt).toLocaleDateString('zh-CN')}</span>
              </div>
            )}
          </div>
        </div>

        {/* 文章列表 */}
        <div className="space-y-3">
          {articles.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <p>{t('noContent')}</p>
            </div>
          ) : (
            articles.map((article) => <ArticleCard key={article.id} article={article} />)
          )}
        </div>

        {/* 加载更多按钮 */}
        {articles.length > 0 && (
          <button className="w-full py-3 text-center text-[#0d9488] font-medium hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors">
            {t('loadMore')}
          </button>
        )}
      </div>
    </div>
  );
}
