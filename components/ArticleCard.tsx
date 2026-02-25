import { Heart, Share2, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface ArticleCardProps {
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
  userInteraction?: {
    isLiked: boolean;
    isBookmarked: boolean;
    isShared: boolean;
  };
}

export function ArticleCard({
  id,
  title,
  summary,
  author,
  publishedAt,
  sourceType,
  imageUrl,
  tags,
  viewCount,
  likeCount,
  shareCount,
  userInteraction,
}: ArticleCardProps) {
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return d.toLocaleDateString('zh-CN');
  };

  return (
    <Link href={`/app/articles/${id}`}>
      <div className="bg-card border border-card-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
        {/* Image */}
        {imageUrl && (
          <div className="w-full h-32 rounded-lg bg-gray-200 mb-3 overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-2">
          {title}
        </h3>

        {/* Summary */}
        {summary && (
          <p className="text-sm text-text-secondary mb-3 line-clamp-2">
            {summary}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs rounded-full bg-text-accent/10 text-text-accent"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-text-muted mb-3">
          <div className="flex gap-2">
            {author && <span>{author}</span>}
            {sourceType && <span>•</span>}
            <span>{sourceType === 'youtube' ? 'YouTube' : 'RSS'}</span>
            <span>•</span>
            <span>{formatDate(publishedAt)}</span>
          </div>
        </div>

        {/* Engagement */}
        <div className="flex items-center justify-between pt-3 border-t border-card-border">
          <div className="flex gap-4 text-xs text-text-muted">
            <div className="flex items-center gap-1">
              <Heart
                size={16}
                className={userInteraction?.isLiked ? 'fill-red-500 text-red-500' : ''}
              />
              {likeCount}
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle size={16} />
              {viewCount}
            </div>
            <div className="flex items-center gap-1">
              <Share2 size={16} />
              {shareCount}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
