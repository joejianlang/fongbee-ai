'use client';

import { useState } from 'react';
import { User, Search, ChevronRight } from 'lucide-react';

type ProviderStatus = 'all' | 'active' | 'pending' | 'inactive';

interface Provider {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  orders: number;
  earnings: number;
  status: 'active' | 'pending' | 'inactive';
}

// TODO: Fetch from API
const mockProviders: Provider[] = [
  { id: '1', name: '李明', email: 'liming@example.com', joinDate: '2024-01-15', orders: 24, earnings: 1200, status: 'active' },
  { id: '2', name: '张华', email: 'zhanghua@example.com', joinDate: '2024-01-20', orders: 18, earnings: 900, status: 'active' },
  { id: '3', name: '王芳', email: 'wangfang@example.com', joinDate: '2024-02-01', orders: 5, earnings: 250, status: 'active' },
  { id: '4', name: '陈伟', email: 'chenwei@example.com', joinDate: '2024-02-10', orders: 0, earnings: 0, status: 'pending' },
  { id: '5', name: '刘洋', email: 'liuyang@example.com', joinDate: '2023-12-01', orders: 2, earnings: 100, status: 'inactive' },
];

const statusLabel = { active: '活跃', pending: '待审核', inactive: '不活跃' };
const statusStyle = {
  active: 'bg-[#0d9488]/20 text-[#0d9488]',
  pending: 'bg-yellow-400/20 text-yellow-400',
  inactive: 'bg-gray-500/20 text-gray-400',
};

export default function ProvidersPage() {
  const [filter, setFilter] = useState<ProviderStatus>('all');
  const [search, setSearch] = useState('');

  const filtered = mockProviders.filter((p) => {
    const matchFilter = filter === 'all' || p.status === filter;
    const matchSearch = p.name.includes(search) || p.email.includes(search);
    return matchFilter && matchSearch;
  });

  return (
    <div className="px-4 py-5">
      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-3.5 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索服务商姓名或邮箱"
          className="w-full bg-[#1a2332] border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-[#0d9488]"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {(['all', 'active', 'pending', 'inactive'] as ProviderStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border transition-all ${
              filter === s
                ? 'bg-[#0d9488]/20 text-[#0d9488] border-[#0d9488]'
                : 'bg-transparent text-gray-400 border-gray-600'
            }`}
          >
            {s === 'all' ? `全部 (${mockProviders.length})` : statusLabel[s]}
          </button>
        ))}
      </div>

      {/* Provider List */}
      <div className="space-y-3">
        {filtered.map((p) => (
          <div key={p.id} className="bg-[#1a2332] rounded-2xl px-5 py-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#253344] flex items-center justify-center">
                  <span className="text-[#0d9488] text-sm font-bold">{p.name[0]}</span>
                </div>
                <div>
                  <p className="text-gray-200 text-sm font-medium">{p.name}</p>
                  <p className="text-gray-500 text-xs">{p.email}</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full ${statusStyle[p.status]}`}>
                {statusLabel[p.status]}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
              <div className="text-center">
                <p className="text-gray-400 text-xs">加入时间</p>
                <p className="text-gray-300 text-xs mt-0.5">{p.joinDate}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs">完成订单</p>
                <p className="text-[#0d9488] text-sm font-bold">{p.orders}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs">带来收益</p>
                <p className="text-[#0d9488] text-sm font-bold">${p.earnings}</p>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#1a2332] flex items-center justify-center mx-auto mb-3">
              <User size={28} className="text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">暂无匹配的服务商</p>
          </div>
        )}
      </div>
    </div>
  );
}
