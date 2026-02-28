'use client';

import { useState } from 'react';
import { Search, Edit2, Trash2, Star, CheckCircle, AlertCircle } from 'lucide-react';
import Pagination from '@/components/Pagination';

interface ServiceProvider {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
}

const MOCK_PROVIDERS: ServiceProvider[] = [
  {
    id: 'SP001',
    name: 'John Smith',
    businessName: '专业清洁服务',
    email: 'john@cleaningservice.com',
    phone: '+1-416-555-0101',
    status: 'ACTIVE',
    isVerified: true,
    averageRating: 4.8,
    totalReviews: 127,
    createdAt: '2025-06-15',
  },
  {
    id: 'SP002',
    name: 'Maria Garcia',
    businessName: '家居维修工坊',
    email: 'maria@homerepair.com',
    phone: '+1-416-555-0102',
    status: 'ACTIVE',
    isVerified: true,
    averageRating: 4.6,
    totalReviews: 89,
    createdAt: '2025-07-20',
  },
  {
    id: 'SP003',
    name: 'David Wilson',
    businessName: '专业电工',
    email: 'david@electrical.com',
    phone: '+1-416-555-0103',
    status: 'ACTIVE',
    isVerified: false,
    averageRating: 4.3,
    totalReviews: 45,
    createdAt: '2025-08-10',
  },
  {
    id: 'SP004',
    name: 'Lisa Chen',
    businessName: '园林景观设计',
    email: 'lisa@landscaping.com',
    phone: '+1-416-555-0104',
    status: 'INACTIVE',
    isVerified: true,
    averageRating: 4.7,
    totalReviews: 156,
    createdAt: '2025-05-01',
  },
  {
    id: 'SP005',
    name: 'Robert Johnson',
    businessName: '搬家服务公司',
    email: 'robert@moving.com',
    phone: '+1-416-555-0105',
    status: 'SUSPENDED',
    isVerified: true,
    averageRating: 3.9,
    totalReviews: 67,
    createdAt: '2025-04-15',
  },
];

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

const PAGE_SIZE = 5;

export default function ProvidersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = MOCK_PROVIDERS.filter((p) => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.businessName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };

  const stats = {
    total: MOCK_PROVIDERS.length,
    active: MOCK_PROVIDERS.filter((p) => p.status === 'ACTIVE').length,
    verified: MOCK_PROVIDERS.filter((p) => p.isVerified).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">服务商列表</h1>
        <p className="text-text-secondary mt-1">管理平台所有服务商账户</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: '总数', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '活跃', value: stats.active, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '已验证', value: stats.verified, color: 'text-purple-600', bg: 'bg-purple-50' },
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
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="搜索服务商名称 / 公司 / 邮箱..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-card-border rounded-lg bg-card text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40"
        />
      </div>

      {/* Providers Table */}
      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border bg-opacity-50">
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">名称</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">公司名称</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">邮箱</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">电话</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">验证</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">评分</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">状态</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-text-muted">
                    未找到匹配的服务商
                  </td>
                </tr>
              ) : (
                paged.map((provider) => (
                  <tr key={provider.id} className="border-b border-card-border hover:bg-opacity-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <p className="font-medium text-text-primary">{provider.name}</p>
                        <p className="text-xs text-text-muted">{provider.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{provider.businessName}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{provider.email}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{provider.phone}</td>
                    <td className="px-6 py-4">
                      {provider.isVerified ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle size={16} />
                          <span className="text-xs font-medium">已验证</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <AlertCircle size={16} />
                          <span className="text-xs font-medium">未验证</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium text-text-primary">
                          {provider.averageRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-text-muted">({provider.totalReviews})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${statusColors[provider.status]}`}>
                        {statusLabels[provider.status]}
                      </span>
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
        <Pagination
          page={page}
          totalPages={totalPages}
          total={filtered.length}
          limit={PAGE_SIZE}
          onChange={setPage}
        />
      </div>
    </div>
  );
}
