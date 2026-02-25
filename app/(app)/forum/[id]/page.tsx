'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ThumbsUp, Send, MapPin, MoreHorizontal } from 'lucide-react';

const MOCK_POST = {
  id: '1',
  author: '王小明',
  avatar: '王',
  title: 'Guelph 哪里有好吃的川菜？',
  content: `最近搬到 Guelph，想找找有没有正宗川菜馆，火锅也行，求推荐！

老家在成都，真的很想念那种麻辣鲜香的味道。之前在 Toronto 住的时候常去 Spadina 那边，但 Guelph 这边感觉华人餐馆不多？

有没有本地朋友知道哪里有好吃的？价格合理就行，不一定要高档。`,
  category: '美食',
  likeCount: 34,
  commentCount: 3,
  timeAgo: '2小时前',
  location: 'Guelph, ON',
};

const MOCK_COMMENTS = [
  { id: 'c1', author: '李美华', avatar: '李', content: '我知道 Stone Road Mall 附近有一家，口味不错！叫"川味坊"，周末要排队。', timeAgo: '1小时前', likes: 12 },
  { id: 'c2', author: '张建国', avatar: '张', content: 'Kortright 和 Gordon 交叉口那里有一家新开的，朋友说还可以，我还没去过。', timeAgo: '45分钟前', likes: 5 },
  { id: 'c3', author: '陈晓燕', avatar: '陈', content: '如果不嫌远，Kitchener 那边选择多一些，开车20分钟。', timeAgo: '20分钟前', likes: 3 },
];

export default function ForumPostPage({ params }: { params: Promise<{ id: string }> }) {
  use(params); // consume params
  const [liked,   setLiked]   = useState(false);
  const [likes,   setLikes]   = useState(MOCK_POST.likeCount);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(MOCK_COMMENTS);

  const handleLike = () => {
    setLiked(!liked);
    setLikes((n) => liked ? n - 1 : n + 1);
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    setComments((prev) => [
      ...prev,
      { id: `c${Date.now()}`, author: '我', avatar: '我', content: comment, timeAgo: '刚刚', likes: 0 },
    ]);
    setComment('');
  };

  return (
    <div className="pb-32 md:pb-20">
      {/* 顶部 */}
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center gap-3">
        <Link href="/forum" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors">
          <ArrowLeft size={18} />返回
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">帖子详情</span>
        <button className="ml-auto text-text-muted hover:text-text-primary transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="px-4 md:px-0 mt-4 space-y-4">
        {/* 帖子主体 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#0d9488] flex items-center justify-center text-white font-bold">
              {MOCK_POST.avatar}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary dark:text-white">{MOCK_POST.author}</p>
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <MapPin size={11} />
                <span>{MOCK_POST.location}</span>
                <span>·</span>
                <span>{MOCK_POST.timeAgo}</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#0d9488]/10 text-[#0d9488] font-medium">
              {MOCK_POST.category}
            </span>
          </div>
          <h1 className="text-base font-bold text-text-primary dark:text-white mb-3">{MOCK_POST.title}</h1>
          <p className="text-sm text-text-secondary dark:text-gray-300 leading-relaxed whitespace-pre-line">{MOCK_POST.content}</p>

          {/* 互动 */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border-primary">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-[#0d9488]' : 'text-text-muted hover:text-[#0d9488]'}`}
            >
              <ThumbsUp size={16} fill={liked ? 'currentColor' : 'none'} />
              <span>{likes}</span>
            </button>
          </div>
        </div>

        {/* 评论列表 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden">
          <p className="text-sm font-semibold text-text-primary dark:text-white px-4 py-3 border-b border-border-primary">
            评论 ({comments.length})
          </p>
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 px-4 py-3.5 border-b border-border-primary last:border-0">
              <div className="w-8 h-8 rounded-full bg-[#0d9488]/20 text-[#0d9488] flex items-center justify-center text-sm font-bold flex-shrink-0">
                {c.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-text-primary dark:text-white">{c.author}</span>
                  <span className="text-xs text-text-muted">{c.timeAgo}</span>
                </div>
                <p className="text-sm text-text-secondary dark:text-gray-300">{c.content}</p>
                <button className="flex items-center gap-1 text-xs text-text-muted mt-1.5 hover:text-[#0d9488]">
                  <ThumbsUp size={11} />{c.likes}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 评论输入框 */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white dark:bg-[#2d2d30] border-t border-border-primary px-4 py-3 flex gap-3 z-40">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleComment()}
          placeholder="写下你的评论..."
          className="flex-1 px-4 py-2.5 text-sm border border-border-primary rounded-full bg-background text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40"
        />
        <button
          onClick={handleComment}
          disabled={!comment.trim()}
          className="w-10 h-10 rounded-full bg-[#0d9488] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#0a7c71] transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
