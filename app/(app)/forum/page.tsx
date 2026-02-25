'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, ThumbsUp, MessageCircle, Plus, ChevronDown } from 'lucide-react';

interface ForumPost {
  id: string;
  author: string;
  avatar: string;
  title: string;
  content: string;
  category: string;
  likeCount: number;
  commentCount: number;
  timeAgo: string;
  location?: string;
  imageUrl?: string;
}

const MOCK_POSTS: ForumPost[] = [
  {
    id: '1',
    author: '王小明',
    avatar: '王',
    title: 'Guelph 哪里有好吃的川菜？',
    content: '最近搬到 Guelph，想找找有没有正宗川菜馆，火锅也行，求推荐！',
    category: '美食',
    likeCount: 34,
    commentCount: 12,
    timeAgo: '2小时前',
    location: 'Guelph, ON',
  },
  {
    id: '2',
    author: '李美华',
    avatar: '李',
    title: '推荐一个靠谱的家政服务',
    content: '双职工家庭，想找个固定每周来打扫的，有没有用过优服佳服务的朋友分享一下体验？',
    category: '家政',
    likeCount: 56,
    commentCount: 28,
    timeAgo: '4小时前',
    location: 'Waterloo, ON',
  },
  {
    id: '3',
    author: '张建国',
    avatar: '张',
    title: '【分享】移民加拿大后第一年踩的坑',
    content: '来加拿大快一年了，把自己的经历整理一下，希望对后来的朋友有帮助...',
    category: '生活',
    likeCount: 189,
    commentCount: 67,
    timeAgo: '1天前',
    location: 'Toronto, ON',
  },
  {
    id: '4',
    author: '陈晓燕',
    avatar: '陈',
    title: 'CRA 报税季来了，有会计师推荐吗？',
    content: '第一次在加拿大报税，完全不懂，求靠谱华人会计师推荐，T4 还没收到...',
    category: '财税',
    likeCount: 92,
    commentCount: 45,
    timeAgo: '1天前',
    location: 'Mississauga, ON',
  },
  {
    id: '5',
    author: '刘大伟',
    avatar: '刘',
    title: '春节联欢 | Guelph 华人社区活动招募',
    content: '今年春节我们社区想办一个小型联欢会，欢迎有才艺的朋友报名参加！',
    category: '活动',
    likeCount: 143,
    commentCount: 38,
    timeAgo: '2天前',
    location: 'Guelph, ON',
  },
];

const CATEGORIES = ['全部', '美食', '家政', '生活', '财税', '活动', '求助', '二手'];

export default function ForumPage() {
  const [activeCategory, setActiveCategory] = useState('全部');

  const filtered = activeCategory === '全部'
    ? MOCK_POSTS
    : MOCK_POSTS.filter((p) => p.category === activeCategory);

  return (
    <div className="pb-4">
      {/* 分类 Tab */}
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary shadow-sm">
        <div className="flex items-center gap-1.5 px-3 py-2.5 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-[#7c3aed] text-white'
                  : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 帖子列表 */}
      <div className="mt-2 space-y-2.5 px-3 md:px-0">
        {filtered.map((post) => (
          <Link
            key={post.id}
            href={`/forum/${post.id}`}
            className="block bg-white dark:bg-[#2d2d30] rounded-xl md:rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            {/* 顶部：头像 + 作者 + 位置 + 分类 */}
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0d9488] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {post.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-text-primary dark:text-white text-sm font-semibold">{post.author}</span>
                {post.location && (
                  <div className="flex items-center gap-1 text-text-muted text-xs mt-0.5">
                    <MapPin size={11} />
                    <span>{post.location}</span>
                    <span>·</span>
                    <span>{post.timeAgo}</span>
                  </div>
                )}
              </div>
              <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full bg-[#0d9488]/10 text-[#0d9488] font-medium">
                {post.category}
              </span>
            </div>

            {/* 标题 */}
            <h2 className="text-text-primary dark:text-white text-sm font-semibold mb-1.5 line-clamp-2">
              {post.title}
            </h2>

            {/* 正文预览 */}
            <p className="text-text-secondary dark:text-gray-300 text-xs leading-relaxed line-clamp-2 mb-3">
              {post.content}
            </p>

            {/* 底部互动 */}
            <div className="flex items-center gap-4 text-text-muted text-xs pt-2.5 border-t border-border-primary">
              <button className="flex items-center gap-1.5 hover:text-[#0d9488] transition-colors">
                <ThumbsUp size={14} />
                <span>{post.likeCount}</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-[#0d9488] transition-colors">
                <MessageCircle size={14} />
                <span>{post.commentCount} 条评论</span>
              </button>
              <button className="flex items-center gap-1 ml-auto hover:text-[#0d9488] transition-colors">
                <span>详情</span>
                <ChevronDown size={13} />
              </button>
            </div>
          </Link>
        ))}
      </div>

      {/* 发帖悬浮按钮 */}
      <Link
        href="/forum/new"
        className="fixed bottom-24 md:bottom-8 right-5 w-14 h-14 bg-[#0d9488] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#0a7c71] transition-colors z-30"
        aria-label="发布帖子"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}
