'use client';

import { useState } from 'react';
import { Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Subscription {
  id: string;
  userId: string;
  userName: string;
  email: string;
  plan: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'SUB001',
    userId: 'U001',
    userName: 'Alice Wang',
    email: 'alice@example.com',
    plan: 'PREMIUM',
    status: 'ACTIVE',
    startDate: '2025-12-01',
    endDate: '2026-01-01',
    autoRenew: true,
  },
  {
    id: 'SUB002',
    userId: 'U002',
    userName: 'Bob Zhang',
    email: 'bob@example.com',
    plan: 'ENTERPRISE',
    status: 'ACTIVE',
    startDate: '2025-11-15',
    endDate: '2026-02-15',
    autoRenew: true,
  },
  {
    id: 'SUB003',
    userId: 'U003',
    userName: 'Carol Liu',
    email: 'carol@example.com',
    plan: 'BASIC',
    status: 'EXPIRED',
    startDate: '2025-08-01',
    endDate: '2025-11-01',
    autoRenew: false,
  },
  {
    id: 'SUB004',
    userId: 'U004',
    userName: 'David Chen',
    email: 'david@example.com',
    plan: 'FREE',
    status: 'ACTIVE',
    startDate: '2025-01-01',
    endDate: '2026-01-01',
    autoRenew: false,
  },
  {
    id: 'SUB005',
    userId: 'U005',
    userName: 'Emma Zhou',
    email: 'emma@example.com',
    plan: 'PREMIUM',
    status: 'PENDING',
    startDate: '2026-02-01',
    endDate: '2026-03-01',
    autoRenew: true,
  },
];

const planLabels: Record<string, string> = {
  FREE: '免费版',
  BASIC: '基础版',
  PREMIUM: '高级版',
  ENTERPRISE: '企业版',
};

const planColors: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-700',
  BASIC: 'bg-blue-100 text-blue-700',
  PREMIUM: 'bg-purple-100 text-purple-700',
  ENTERPRISE: 'bg-yellow-100 text-yellow-700',
};

const statusColors: Record<string, { bg: string; icon: React.ReactNode }> = {
  ACTIVE: { bg: 'bg-green-100 text-green-700', icon: <CheckCircle size={16} /> },
  EXPIRED: { bg: 'bg-gray-100 text-gray-700', icon: <XCircle size={16} /> },
  CANCELLED: { bg: 'bg-red-100 text-red-700', icon: <XCircle size={16} /> },
  PENDING: { bg: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle size={16} /> },
};

const statusLabels: Record<string, string> = {
  ACTIVE: '活跃',
  EXPIRED: '已过期',
  CANCELLED: '已取消',
  PENDING: '待激活',
};

export default function SubscriptionsPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_SUBSCRIPTIONS.filter((s) => {
    const matchSearch = !search ||
      s.userName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.userId.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const stats = {
    total: MOCK_SUBSCRIPTIONS.length,
    active: MOCK_SUBSCRIPTIONS.filter((s) => s.status === 'ACTIVE').length,
    premium: MOCK_SUBSCRIPTIONS.filter((s) => s.plan === 'PREMIUM' || s.plan === 'ENTERPRISE').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">订阅记录</h1>
        <p className="text-text-secondary mt-1">查看和管理用户订阅信息</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: '总订阅', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '活跃', value: stats.active, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '付费版', value: stats.premium, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((c) => (
          <div key={c.label} className={`${c.bg} rounded-xl px-5 py-4`}>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-sm text-text-secondary">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative flex-1 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索用户名 / 邮箱 / ID..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-card-border rounded-lg bg-card text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40"
        />
      </div>

      {/* Subscriptions Table */}
      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border bg-opacity-50">
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">用户</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">套餐</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">状态</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">开始日期</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">结束日期</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">自动续费</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                    未找到匹配的订阅记录
                  </td>
                </tr>
              ) : (
                filtered.map((subscription) => (
                  <tr key={subscription.id} className="border-b border-card-border hover:bg-opacity-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <p className="font-medium text-text-primary">{subscription.userName}</p>
                        <p className="text-xs text-text-muted">{subscription.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${planColors[subscription.plan]}`}>
                        {planLabels[subscription.plan]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium ${statusColors[subscription.status].bg}`}>
                        {statusColors[subscription.status].icon}
                        {statusLabels[subscription.status]}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{subscription.startDate}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{subscription.endDate}</td>
                    <td className="px-6 py-4">
                      {subscription.autoRenew ? (
                        <span className="text-xs font-medium text-green-600">✓ 已启用</span>
                      ) : (
                        <span className="text-xs font-medium text-gray-600">✗ 已禁用</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
