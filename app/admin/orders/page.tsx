'use client';

import { useState } from 'react';
import { Search, Filter, Eye } from 'lucide-react';

type OrderStatus = '全部' | '待处理' | '进行中' | '已完成' | '已取消';

interface Order {
  id: string;
  customer: string;
  provider: string;
  service: string;
  amount: string;
  status: '待处理' | '进行中' | '已完成' | '已取消';
  date: string;
}

const MOCK_ORDERS: Order[] = [
  { id: '#ORD-001', customer: 'Alice Wang',   provider: '李师傅',   service: '标准服务', amount: '$150.00', status: '已完成', date: '2026-02-20' },
  { id: '#ORD-002', customer: 'Bob Zhang',    provider: '张阿姨',   service: '简单定制', amount: '$320.00', status: '进行中', date: '2026-02-21' },
  { id: '#ORD-003', customer: 'Carol Liu',    provider: '王师傅',   service: '复杂定制', amount: '$2400.00',status: '待处理', date: '2026-02-22' },
  { id: '#ORD-004', customer: 'David Chen',   provider: '刘阿姨',   service: '标准服务', amount: '$180.00', status: '已完成', date: '2026-02-22' },
  { id: '#ORD-005', customer: 'Emma Zhou',    provider: '陈师傅',   service: '简单定制', amount: '$260.00', status: '已取消', date: '2026-02-23' },
  { id: '#ORD-006', customer: 'Frank Wu',     provider: '赵阿姨',   service: '标准服务', amount: '$140.00', status: '进行中', date: '2026-02-23' },
  { id: '#ORD-007', customer: 'Grace Li',     provider: '孙师傅',   service: '复杂定制', amount: '$3100.00',status: '待处理', date: '2026-02-24' },
  { id: '#ORD-008', customer: 'Henry Guo',    provider: '周阿姨',   service: '标准服务', amount: '$165.00', status: '已完成', date: '2026-02-24' },
];

const STATUS_STYLES: Record<Order['status'], string> = {
  '待处理': 'bg-yellow-100 text-yellow-700',
  '进行中': 'bg-blue-100 text-blue-700',
  '已完成': 'bg-green-100 text-green-700',
  '已取消': 'bg-gray-100 text-gray-500',
};

export default function OrdersPage() {
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState<OrderStatus>('全部');

  const filtered = MOCK_ORDERS.filter((o) => {
    const matchStatus  = status === '全部' || o.status === status;
    const matchSearch  = !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.provider.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">订单管理</h1>
        <p className="text-text-secondary mt-1">查看并管理所有平台订单</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索订单号 / 用户 / 服务商..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-card-border rounded-lg bg-card text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 flex-wrap">
          <Filter size={14} className="text-text-muted mr-1" />
          {(['全部', '待处理', '进行中', '已完成', '已取消'] as OrderStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                status === s
                  ? 'bg-[#0d9488] text-white'
                  : 'bg-card border border-card-border text-text-secondary hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-gray-50 dark:bg-white/5">
                {['订单号', '客户', '服务商', '服务类型', '金额', '状态', '日期', '操作'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-text-secondary whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-text-muted">暂无订单</td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="border-b border-card-border last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-text-primary whitespace-nowrap">{o.id}</td>
                    <td className="px-5 py-3.5 text-text-secondary">{o.customer}</td>
                    <td className="px-5 py-3.5 text-text-secondary">{o.provider}</td>
                    <td className="px-5 py-3.5 text-text-secondary">{o.service}</td>
                    <td className="px-5 py-3.5 font-medium text-text-primary">{o.amount}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[o.status]}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-text-muted whitespace-nowrap">{o.date}</td>
                    <td className="px-5 py-3.5">
                      <button className="flex items-center gap-1 text-[#0d9488] hover:underline text-xs font-medium">
                        <Eye size={13} />
                        查看
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-card-border text-xs text-text-muted">
          <span>共 {filtered.length} 条</span>
          <div className="flex gap-1">
            {[1, 2, 3].map((p) => (
              <button key={p} className={`w-7 h-7 rounded text-xs font-medium ${p === 1 ? 'bg-[#0d9488] text-white' : 'hover:bg-gray-100 text-text-secondary'}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
