'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Package } from 'lucide-react';

type OrderStatus = '全部' | '待确认' | '进行中' | '已完成' | '已取消';

interface MyOrder {
  id: string;
  service: string;
  provider: string;
  imageUrl: string;
  date: string;
  time: string;
  amount: number;
  status: '待确认' | '进行中' | '已完成' | '已取消';
}

const MY_ORDERS: MyOrder[] = [
  { id: 'ORD-10023', service: '专业家居深度清洁', provider: '洁净之家',     imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=120&h=80&fit=crop', date: '2026-02-28', time: '10:00', amount: 120,  status: '待确认' },
  { id: 'ORD-10018', service: '水电暖气维修',     provider: '全能师傅',     imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=120&h=80&fit=crop', date: '2026-02-20', time: '14:00', amount: 160,  status: '已完成' },
  { id: 'ORD-10012', service: '儿童中文家教',     provider: '张老师',       imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=120&h=80&fit=crop', date: '2026-02-15', time: '16:00', amount: 90,   status: '已完成' },
  { id: 'ORD-10007', service: '草坪修剪 & 园艺护理', provider: '绿拇指园艺', imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=120&h=80&fit=crop', date: '2026-01-30', time: '09:00', amount: 60,   status: '已取消' },
];

const STATUS_STYLES: Record<MyOrder['status'], string> = {
  '待确认': 'bg-yellow-100 text-yellow-700',
  '进行中': 'bg-blue-100 text-blue-700',
  '已完成': 'bg-green-100 text-green-700',
  '已取消': 'bg-gray-100 text-gray-500',
};

export default function MyOrdersPage() {
  const [tab, setTab] = useState<OrderStatus>('全部');

  const filtered = tab === '全部' ? MY_ORDERS : MY_ORDERS.filter((o) => o.status === tab);

  return (
    <div className="pb-6">
      {/* 顶部 */}
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors">
          <ArrowLeft size={18} />
          返回
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">我的订单</span>
      </div>

      {/* Tab */}
      <div className="bg-white dark:bg-[#2d2d30] border-b border-border-primary flex overflow-x-auto scrollbar-hide">
        {(['全部', '待确认', '进行中', '已完成', '已取消'] as OrderStatus[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-[#0d9488] text-[#0d9488]' : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 订单列表 */}
      <div className="mt-2 px-3 md:px-0 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <Package size={40} className="mb-3 opacity-30" />
            <p className="text-sm">暂无订单</p>
          </div>
        ) : (
          filtered.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <img src={o.imageUrl} alt={o.service} className="w-24 h-24 object-cover flex-shrink-0" />
              <div className="flex-1 p-3 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-text-primary dark:text-white line-clamp-1">{o.service}</p>
                  <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                </div>
                <p className="text-xs text-[#0d9488] mt-0.5">{o.provider}</p>
                <p className="text-xs text-text-muted mt-1">{o.date} {o.time}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-text-primary dark:text-white">${o.amount}</span>
                  <ChevronRight size={14} className="text-text-muted" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
