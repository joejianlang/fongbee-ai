'use client';

import { useState } from 'react';
import { Search, Edit2, Trash2, TrendingUp, Users, Building } from 'lucide-react';

interface SalesPartner {
  id: string;
  name: string;
  companyName: string;
  email: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  referralCode: string;
  totalUsersInvited: number;
  totalProvidersInvited: number;
  createdAt: string;
}

const MOCK_PARTNERS: SalesPartner[] = [
  {
    id: 'SP001',
    name: 'Alice Wang',
    companyName: '科技有限公司',
    email: 'alice@company.com',
    tier: 'GOLD',
    status: 'ACTIVE',
    referralCode: 'SP12345ABCDEF',
    totalUsersInvited: 45,
    totalProvidersInvited: 12,
    createdAt: '2025-09-15',
  },
  {
    id: 'SP002',
    name: 'Bob Zhang',
    companyName: '商务服务公司',
    email: 'bob@company.com',
    tier: 'SILVER',
    status: 'ACTIVE',
    referralCode: 'SP67890GHIJKL',
    totalUsersInvited: 28,
    totalProvidersInvited: 6,
    createdAt: '2025-10-20',
  },
  {
    id: 'SP003',
    name: 'Carol Liu',
    companyName: '数字营销公司',
    email: 'carol@company.com',
    tier: 'BRONZE',
    status: 'ACTIVE',
    referralCode: 'SPMNOPQRSTUV',
    totalUsersInvited: 12,
    totalProvidersInvited: 3,
    createdAt: '2025-11-01',
  },
];

const tierLabels: Record<string, string> = {
  BRONZE: '青铜级',
  SILVER: '白银级',
  GOLD: '黄金级',
};

const tierColors: Record<string, string> = {
  BRONZE: 'bg-amber-100 text-amber-700',
  SILVER: 'bg-gray-200 text-gray-700',
  GOLD: 'bg-yellow-100 text-yellow-700',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  ACTIVE: '活跃',
  INACTIVE: '非活跃',
  SUSPENDED: '暂停',
};

export default function SalesPartnersListPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_PARTNERS.filter((p) => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.companyName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.referralCode.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const stats = {
    total: MOCK_PARTNERS.length,
    active: MOCK_PARTNERS.filter((p) => p.status === 'ACTIVE').length,
    gold: MOCK_PARTNERS.filter((p) => p.tier === 'GOLD').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">销售合伙人列表</h1>
        <p className="text-text-secondary mt-1">管理平台所有销售合伙人账户</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: '总数', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
          { label: '活跃', value: stats.active, color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp },
          { label: '金级', value: stats.gold, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Building },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`${c.bg} rounded-xl px-5 py-4 flex items-center gap-3`}>
              <Icon size={20} className={c.color} />
              <div>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-sm text-text-secondary">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative flex-1 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索合伙人名称 / 公司 / 邮箱..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-card-border rounded-lg bg-card text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40"
        />
      </div>

      {/* Partners Table */}
      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border bg-opacity-50">
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">名称</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">公司</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">等级</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">状态</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">邀请码</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">邀请数</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                    未找到匹配的销售合伙人
                  </td>
                </tr>
              ) : (
                filtered.map((partner) => (
                  <tr key={partner.id} className="border-b border-card-border hover:bg-opacity-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <p className="font-medium text-text-primary">{partner.name}</p>
                        <p className="text-xs text-text-muted">{partner.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{partner.companyName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${tierColors[partner.tier]}`}>
                        {tierLabels[partner.tier]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${statusColors[partner.status]}`}>
                        {statusLabels[partner.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-text-primary">{partner.referralCode}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Users size={14} className="text-text-muted" />
                          <span className="text-sm text-text-primary">{partner.totalUsersInvited}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building size={14} className="text-text-muted" />
                          <span className="text-sm text-text-primary">{partner.totalProvidersInvited}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-1.5 rounded hover:bg-opacity-50 text-text-muted hover:text-text-primary transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1.5 rounded hover:bg-opacity-50 text-text-muted hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
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
