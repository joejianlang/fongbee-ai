'use client';

import { useState } from 'react';
import { ClipboardList } from 'lucide-react';

type OrderTab = 'standard' | 'custom';
type OrderFilter = '全部' | '待付款' | '待上门' | '待验收' | '服务中' | '已完成' | '已取消';

const filters: OrderFilter[] = ['全部', '待付款', '待上门', '待验收', '服务中', '已完成', '已取消'];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderTab>('standard');
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('全部');

  // TODO: Fetch real orders from API
  const orders: unknown[] = [];

  return (
    <div className="px-4 pt-6">
      {/* Page Title */}
      <h1 className="text-white text-lg font-bold text-center mb-6">订单中心</h1>

      {/* Order Type Tabs */}
      <div className="flex bg-[#1a2332] rounded-xl p-1 mb-4">
        <button
          onClick={() => setActiveTab('standard')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'standard'
              ? 'bg-[#10b981] text-white'
              : 'text-gray-400'
          }`}
        >
          标准服务订单
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'custom'
              ? 'bg-[#10b981] text-white'
              : 'text-gray-400'
          }`}
        >
          定制服务报价/订单
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all border ${
              activeFilter === filter
                ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]'
                : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Orders List / Empty State */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20">
          <div className="w-24 h-24 rounded-full bg-[#1a2332] flex items-center justify-center mb-4">
            <ClipboardList size={40} className="text-[#10b981]/50" />
          </div>
          <p className="text-white text-base font-semibold mb-2">暂无订单</p>
          <p className="text-gray-500 text-sm">当前筛选条件下没有订单</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* TODO: Render order cards */}
        </div>
      )}
    </div>
  );
}
