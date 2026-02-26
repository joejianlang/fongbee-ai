'use client';

import { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

interface Content {
  id: string;
  title: string;
  type: string;
  status: 'PUBLISHED' | 'DRAFT';
  views: number;
  lastModified: string;
}

const MOCK_CONTENT: Content[] = [
  { id: 'C001', title: '平台使用指南', type: '指南', status: 'PUBLISHED', views: 2145, lastModified: '2025-12-10' },
  { id: 'C002', title: '服务条款更新', type: '条款', status: 'PUBLISHED', views: 856, lastModified: '2025-12-08' },
  { id: 'C003', title: '隐私政策', type: '政策', status: 'PUBLISHED', views: 423, lastModified: '2025-12-01' },
  { id: 'C004', title: '2026年发展规划', type: '公告', status: 'DRAFT', views: 0, lastModified: '2025-12-15' },
];

export default function ContentManagementPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_CONTENT.filter((c) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: MOCK_CONTENT.length,
    published: MOCK_CONTENT.filter((c) => c.status === 'PUBLISHED').length,
    totalViews: MOCK_CONTENT.reduce((sum, c) => sum + c.views, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">内容管理</h1>
          <p className="text-text-secondary mt-1">管理平台内容</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0d9488] text-white rounded-lg font-medium hover:bg-[#0a7c71]">
          <Plus size={18} />
          创建内容
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '总内容', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '已发布', value: stats.published, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '总浏览', value: stats.totalViews, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((c) => (
          <div key={c.label} className={`${c.bg} rounded-xl px-5 py-4`}>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-sm text-text-secondary">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="relative flex-1 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索内容..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-card-border rounded-lg bg-card text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40"
        />
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-card-border bg-opacity-50">
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">标题</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">类型</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">浏览量</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">状态</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">最后修改</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                  未找到匹配的内容
                </td>
              </tr>
            ) : (
              filtered.map((content) => (
                <tr key={content.id} className="border-b border-card-border hover:bg-opacity-50">
                  <td className="px-6 py-4 font-medium text-text-primary">{content.title}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{content.type}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{content.views}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-xs font-medium ${content.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {content.status === 'PUBLISHED' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{content.lastModified}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-1.5 rounded hover:text-text-primary transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-1.5 rounded hover:text-red-600 transition-colors">
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
  );
}
