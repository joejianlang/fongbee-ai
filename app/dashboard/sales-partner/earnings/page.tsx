'use client';

import { useState } from 'react';
import { ArrowDownLeft, TrendingUp } from 'lucide-react';

type Period = 'month' | 'quarter' | 'year' | 'all';

interface EarningRecord {
  id: string;
  providerName: string;
  description: string;
  amount: number;
  commission: number;
  date: string;
  status: '已结算' | '待结算';
}

// TODO: Fetch from API
const mockEarnings: EarningRecord[] = [
  { id: '1', providerName: '李明', description: '服务商订单佣金', amount: 1200, commission: 120, date: '2024-01-20', status: '已结算' },
  { id: '2', providerName: '张华', description: '服务商订单佣金', amount: 900, commission: 90, date: '2024-01-18', status: '已结算' },
  { id: '3', providerName: '王芳', description: '服务商订单佣金', amount: 250, commission: 25, date: '2024-01-15', status: '待结算' },
  { id: '4', providerName: '李明', description: '服务商订单佣金', amount: 400, commission: 40, date: '2024-01-10', status: '待结算' },
  { id: '5', providerName: '张华', description: '服务商订单佣金', amount: 600, commission: 60, date: '2024-01-05', status: '已结算' },
];

const periodLabel: Record<Period, string> = { month: '本月', quarter: '本季度', year: '今年', all: '全部' };

export default function EarningsPage() {
  const [period, setPeriod] = useState<Period>('month');

  const totalEarned = mockEarnings.filter(e => e.status === '已结算').reduce((s, e) => s + e.commission, 0);
  const pending = mockEarnings.filter(e => e.status === '待结算').reduce((s, e) => s + e.commission, 0);
  const commissionRate = 10;

  return (
    <div className="px-4 py-5 space-y-4">
      {/* Summary Cards */}
      <div className="bg-[#1a2332] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-[#0d9488]" />
          <span className="text-gray-200 text-sm font-semibold">收益概览</span>
          <span className="ml-auto text-xs bg-[#0d9488]/20 text-[#0d9488] px-2 py-0.5 rounded-full">
            佣金比例 {commissionRate}%
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#253344] rounded-xl p-4 text-center">
            <p className="text-gray-400 text-xs mb-1">累计已结算</p>
            <p className="text-[#0d9488] text-2xl font-bold">${totalEarned}</p>
          </div>
          <div className="bg-[#253344] rounded-xl p-4 text-center">
            <p className="text-gray-400 text-xs mb-1">待结算</p>
            <p className="text-orange-400 text-2xl font-bold">${pending}</p>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['month', 'quarter', 'year', 'all'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border transition-all ${
              period === p
                ? 'bg-[#0d9488]/20 text-[#0d9488] border-[#0d9488]'
                : 'bg-transparent text-gray-400 border-gray-600'
            }`}
          >
            {periodLabel[p]}
          </button>
        ))}
      </div>

      {/* Earnings List */}
      <div className="space-y-3">
        {mockEarnings.map((e) => (
          <div key={e.id} className="flex items-center bg-[#1a2332] rounded-2xl px-5 py-4 gap-4">
            <div className="w-10 h-10 rounded-full bg-[#0d9488]/15 flex items-center justify-center flex-shrink-0">
              <ArrowDownLeft size={18} className="text-[#0d9488]" />
            </div>
            <div className="flex-1">
              <p className="text-gray-200 text-sm">{e.providerName} · {e.description}</p>
              <p className="text-gray-500 text-xs mt-0.5">{e.date} · 订单金额 ${e.amount}</p>
            </div>
            <div className="text-right">
              <p className="text-[#0d9488] text-sm font-bold">+${e.commission}</p>
              <p className={`text-xs mt-0.5 ${e.status === '已结算' ? 'text-[#0d9488]' : 'text-yellow-400'}`}>
                {e.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
