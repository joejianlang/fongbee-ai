'use client';

import { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  servicesCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

const MOCK_CATEGORIES: ServiceCategory[] = [
  {
    id: 'CAT001',
    name: '家政清洁',
    description: '家庭清洁和保洁服务',
    icon: '🧹',
    servicesCount: 24,
    status: 'ACTIVE',
    createdAt: '2025-06-15',
  },
  {
    id: 'CAT002',
    name: '房屋维修',
    description: '家庭装修和维修',
    icon: '🔧',
    servicesCount: 18,
    status: 'ACTIVE',
    createdAt: '2025-07-20',
  },
  {
    id: 'CAT003',
    name: '搬家服务',
    description: '搬家和物流运输',
    icon: '📦',
    servicesCount: 12,
    status: 'ACTIVE',
    createdAt: '2025-08-10',
  },
  {
    id: 'CAT004',
    name: '美发美容',
    description: '美发、美甲、美容服务',
    icon: '💇',
    servicesCount: 15,
    status: 'ACTIVE',
    createdAt: '2025-09-05',
  },
  {
    id: 'CAT005',
    name: '教育培训',
    description: '各类教育培训课程',
    icon: '📚',
    servicesCount: 22,
    status: 'ACTIVE',
    createdAt: '2025-10-01',
  },
];

export default function CategoriesManagementPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_CATEGORIES.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const stats = {
    total: MOCK_CATEGORIES.length,
    active: MOCK_CATEGORIES.filter((c) => c.status === 'ACTIVE').length,
    services: MOCK_CATEGORIES.reduce((sum, c) => sum + c.servicesCount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">分类管理</h1>
          <p className="text-text-secondary mt-1">管理平台服务分类</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0d9488] text-white rounded-lg font-medium hover:bg-[#0a7c71] transition-colors">
          <Plus size={18} />
          新增分类
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: '总分类', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '已激活', value: stats.active, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '服务总数', value: stats.services, color: 'text-purple-600', bg: 'bg-purple-50' },
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
          placeholder="搜索分类..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-card-border rounded-lg bg-card text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40"
        />
      </div>

      {/* Categories Table */}
      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border bg-opacity-50">
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">分类名称</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">描述</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">服务数</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">状态</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">创建时间</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                    未找到匹配的分类
                  </td>
                </tr>
              ) : (
                filtered.map((category) => (
                  <tr key={category.id} className="border-b border-card-border hover:bg-opacity-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <span className="font-medium text-text-primary">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{category.description}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {category.servicesCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${category.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {category.status === 'ACTIVE' ? '已激活' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{category.createdAt}</td>
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
