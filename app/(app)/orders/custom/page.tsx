'use client';

import { useState } from 'react';
import { ClipboardList, ChevronLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type OrderStatus = '全部' | '待报价' | '已报价' | '进行中' | '已完成' | '已取消';

interface CustomOrder {
  id: string;
  title: string;
  description: string;
  date: string;
  status: '待报价' | '已报价' | '进行中' | '已完成' | '已取消';
  quotes: number;
  budget: string;
}

// TODO: Fetch from API
const mockOrders: CustomOrder[] = [
  {
    id: '1',
    title: '房屋深度清洁',
    description: '需要对3室2厅进行全面深度清洁，包括厨房油烟机和浴室',
    date: '2024-01-20',
    status: '已报价',
    quotes: 3,
    budget: '$150–$250',
  },
  {
    id: '2',
    title: '花园修剪整理',
    description: '前后花园草坪修剪、树枝修剪以及落叶清理',
    date: '2024-01-18',
    status: '进行中',
    quotes: 2,
    budget: '$80–$120',
  },
  {
    id: '3',
    title: '家具组装',
    description: 'IKEA书柜和衣柜组装，共4件',
    date: '2024-01-10',
    status: '已完成',
    quotes: 5,
    budget: '$60–$100',
  },
];

const filters: OrderStatus[] = ['全部', '待报价', '已报价', '进行中', '已完成', '已取消'];

const statusStyle: Record<CustomOrder['status'], string> = {
  '待报价': 'bg-gray-500/20 text-gray-400',
  '已报价': 'bg-blue-400/20 text-blue-400',
  '进行中': 'bg-yellow-400/20 text-yellow-400',
  '已完成': 'bg-[#0d9488]/20 text-[#0d9488]',
  '已取消': 'bg-red-400/20 text-red-400',
};

export default function CustomOrdersPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<OrderStatus>('全部');

  const filtered = mockOrders.filter(
    (o) => filter === '全部' || o.status === filter
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1724]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a2332] px-4 pt-12 pb-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          <ChevronLeft size={22} className="text-gray-700 dark:text-white" />
        </button>
        <h1 className="flex-1 text-base font-bold text-gray-900 dark:text-white">定制服务订单</h1>
        <Link
          href="/services/custom"
          className="flex items-center gap-1 bg-[#0d9488] text-white text-xs font-semibold px-3 py-1.5 rounded-full"
        >
          <Plus size={13} />
          发布需求
        </Link>
      </div>

      <div className="px-4 py-4">
        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border transition-all ${
                filter === f
                  ? 'bg-[#0d9488]/10 text-[#0d9488] border-[#0d9488]'
                  : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Order List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-[#1a2332] flex items-center justify-center mb-4">
              <ClipboardList size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">暂无定制服务订单</p>
            <Link
              href="/services/custom"
              className="mt-4 bg-[#0d9488] text-white text-sm font-semibold px-6 py-2.5 rounded-full"
            >
              立即发布需求
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <div key={order.id} className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-gray-900 dark:text-white text-sm font-semibold flex-1 mr-3">{order.title}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${statusStyle[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">{order.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-gray-400 text-xs">预算</p>
                      <p className="text-[#0d9488] text-xs font-semibold">{order.budget}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">报价数</p>
                      <p className="text-gray-700 dark:text-gray-200 text-xs font-semibold">{order.quotes} 个</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">{order.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
