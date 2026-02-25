'use client';

import Link from 'next/link';
import { ArrowLeft, Star, MessageSquarePlus } from 'lucide-react';

interface MyReview {
  id: string;
  service: string;
  provider: string;
  imageUrl: string;
  rating: number;
  content: string;
  date: string;
}

const MY_REVIEWS: MyReview[] = [
  {
    id: '1',
    service: '水电暖气维修',
    provider: '全能师傅',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=120&h=80&fit=crop',
    rating: 5,
    content: '师傅非常专业，准时上门，漏水问题当天就解决了，价格合理，强烈推荐！',
    date: '2026-02-21',
  },
  {
    id: '2',
    service: '儿童中文家教',
    provider: '张老师',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=120&h=80&fit=crop',
    rating: 5,
    content: '张老师教学耐心，孩子非常喜欢，短短一个月汉字写得明显进步了。',
    date: '2026-02-16',
  },
];

export default function ReviewsPage() {
  return (
    <div className="pb-6">
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors">
          <ArrowLeft size={18} />返回
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">我的评价</span>
        <span className="ml-auto text-xs text-text-muted">{MY_REVIEWS.length} 条</span>
      </div>

      <div className="mt-2 px-3 md:px-0 space-y-3">
        {MY_REVIEWS.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <MessageSquarePlus size={40} className="mb-3 opacity-30" />
            <p className="text-sm">暂无评价</p>
            <Link href="/orders" className="mt-3 text-sm text-[#0d9488]">去查看订单 →</Link>
          </div>
        ) : (
          MY_REVIEWS.map((r) => (
            <div key={r.id} className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden">
              <div className="flex">
                <img src={r.imageUrl} alt={r.service} className="w-20 h-20 object-cover flex-shrink-0" />
                <div className="flex-1 p-3">
                  <p className="text-sm font-semibold text-text-primary dark:text-white line-clamp-1">{r.service}</p>
                  <p className="text-xs text-[#0d9488] mt-0.5">{r.provider}</p>
                  <div className="flex mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} fill={i < r.rating ? '#f59e0b' : 'none'} className={i < r.rating ? 'text-[#f59e0b]' : 'text-gray-300'} />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-text-muted pr-3 pt-3">{r.date}</span>
              </div>
              <div className="px-4 pb-4 pt-1">
                <p className="text-sm text-text-secondary dark:text-gray-300 leading-relaxed">{r.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
