'use client';

import { DollarSign, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';

const MONTHLY_DATA = [
  { month: 'Sep', revenue: 8200,  payout: 6560,  fee: 1640 },
  { month: 'Oct', revenue: 9500,  payout: 7600,  fee: 1900 },
  { month: 'Nov', revenue: 10800, payout: 8640,  fee: 2160 },
  { month: 'Dec', revenue: 11200, payout: 8960,  fee: 2240 },
  { month: 'Jan', revenue: 10100, payout: 8080,  fee: 2020 },
  { month: 'Feb', revenue: 12450, payout: 9960,  fee: 2490 },
];

const RECENT_SETTLEMENTS = [
  { id: '#SET-001', provider: '李师傅',     amount: '$1,240.00', fee: '$124.00', date: '2026-02-24', status: 'settled' },
  { id: '#SET-002', provider: '张阿姨',     amount: '$860.00',   fee: '$86.00',  date: '2026-02-23', status: 'settled' },
  { id: '#SET-003', provider: '王师傅团队', amount: '$3,200.00', fee: '$320.00', date: '2026-02-22', status: 'pending' },
  { id: '#SET-004', provider: '绿拇指园艺', amount: '$4,500.00', fee: '$450.00', date: '2026-02-21', status: 'settled' },
  { id: '#SET-005', provider: '陈技术',     amount: '$720.00',   fee: '$72.00',  date: '2026-02-20', status: 'pending' },
];

const maxRevenue = Math.max(...MONTHLY_DATA.map((d) => d.revenue));

export default function FinancePage() {
  const current  = MONTHLY_DATA[MONTHLY_DATA.length - 1];
  const previous = MONTHLY_DATA[MONTHLY_DATA.length - 2];
  const revenueGrowth = (((current.revenue - previous.revenue) / previous.revenue) * 100).toFixed(1);
  const isGrowthPositive = current.revenue >= previous.revenue;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">财务报表</h1>
        <p className="text-text-secondary mt-1">平台收入、支出与结算概览</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: '本月总收入',
            value: `$${current.revenue.toLocaleString()}`,
            sub: `较上月 ${isGrowthPositive ? '+' : ''}${revenueGrowth}%`,
            icon: <DollarSign size={20} />,
            up: isGrowthPositive,
            bg: 'bg-green-50',
            iconColor: 'text-green-600',
          },
          {
            label: '本月平台手续费',
            value: `$${current.fee.toLocaleString()}`,
            sub: '平台收益 (10%)',
            icon: <CreditCard size={20} />,
            up: true,
            bg: 'bg-blue-50',
            iconColor: 'text-blue-600',
          },
          {
            label: '本月服务商结算',
            value: `$${current.payout.toLocaleString()}`,
            sub: '已付出金额 (80%)',
            icon: <TrendingUp size={20} />,
            up: true,
            bg: 'bg-purple-50',
            iconColor: 'text-purple-600',
          },
          {
            label: '待结算金额',
            value: '$4,720.00',
            sub: '2 笔待处理',
            icon: <TrendingDown size={20} />,
            up: false,
            bg: 'bg-yellow-50',
            iconColor: 'text-yellow-600',
          },
        ].map((card) => (
          <div key={card.label} className={`${card.bg} rounded-xl px-5 py-5`}>
            <div className={`${card.iconColor} mb-3`}>{card.icon}</div>
            <p className="text-2xl font-bold text-text-primary">{card.value}</p>
            <p className="text-xs text-text-secondary mt-1">{card.label}</p>
            <p className={`text-xs mt-1 font-medium ${card.up ? 'text-green-600' : 'text-yellow-600'}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h3 className="text-base font-bold text-text-primary mb-5">近6个月收入趋势</h3>
        <div className="flex items-end gap-3 h-40">
          {MONTHLY_DATA.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              {/* Stacked bar */}
              <div className="w-full flex flex-col justify-end" style={{ height: `${(d.revenue / maxRevenue) * 120}px` }}>
                {/* Fee portion */}
                <div
                  className="w-full bg-[#0d9488]/40 rounded-t"
                  style={{ height: `${(d.fee / d.revenue) * 100}%` }}
                />
                {/* Payout portion */}
                <div
                  className="w-full bg-[#0d9488]"
                  style={{ height: `${(d.payout / d.revenue) * 100}%` }}
                />
              </div>
              <span className="text-xs text-text-muted">{d.month}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <div className="w-3 h-3 rounded-sm bg-[#0d9488]" />服务商结算
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <div className="w-3 h-3 rounded-sm bg-[#0d9488]/40" />平台手续费
          </div>
        </div>
      </div>

      {/* Recent Settlements */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-card-border">
          <h3 className="font-bold text-text-primary">最近结算记录</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-gray-50 dark:bg-white/5">
                {['结算单号', '服务商', '结算金额', '平台手续费', '日期', '状态'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-text-secondary whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_SETTLEMENTS.map((s) => (
                <tr key={s.id} className="border-b border-card-border last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-text-primary">{s.id}</td>
                  <td className="px-5 py-3.5 text-text-secondary">{s.provider}</td>
                  <td className="px-5 py-3.5 font-medium text-text-primary">{s.amount}</td>
                  <td className="px-5 py-3.5 text-text-muted">{s.fee}</td>
                  <td className="px-5 py-3.5 text-text-muted whitespace-nowrap">{s.date}</td>
                  <td className="px-5 py-3.5">
                    {s.status === 'settled' ? (
                      <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">已结算</span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2.5 py-1 rounded-full font-medium">待处理</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
