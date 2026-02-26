'use client';

import { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

interface KnowledgeItem {
  id: string;
  question: string;
  category: string;
  views: number;
  status: 'PUBLISHED' | 'DRAFT';
  createdAt: string;
}

const MOCK_ITEMS: KnowledgeItem[] = [
  { id: 'KB001', question: '如何联系服务商？', category: '常见问题', views: 234, status: 'PUBLISHED', createdAt: '2025-10-15' },
  { id: 'KB002', question: '支付方式有哪些？', category: '支付相关', views: 156, status: 'PUBLISHED', createdAt: '2025-10-10' },
  { id: 'KB003', question: '如何取消预约？', category: '订单管理', views: 89, status: 'PUBLISHED', createdAt: '2025-10-05' },
  { id: 'KB004', question: '退款流程是什么？', category: '退款相关', views: 0, status: 'DRAFT', createdAt: '2025-12-15' },
];

export default function KnowledgeConfigPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_ITEMS.filter((i) =>
    !search || i.question.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: MOCK_ITEMS.length,
    published: MOCK_ITEMS.filter((i) => i.status === 'PUBLISHED').length,
    totalViews: MOCK_ITEMS.reduce((sum, i) => sum + i.views, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">知识库配置</h1>
          <p className="text-text-secondary mt-1">配置知识库和FAQ</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0d9488] text-white rounded-lg font-medium hover:bg-[#0a7c71]">
          <Plus size={18} />
          新增内容
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '总条目', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
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
          placeholder="搜索知识库..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-card-border rounded-lg bg-card text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40"
        />
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-card-border bg-opacity-50">
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">问题</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">分类</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">浏览次数</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">状态</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">创建时间</th>
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
              filtered.map((item) => (
                <tr key={item.id} className="border-b border-card-border hover:bg-opacity-50">
                  <td className="px-6 py-4 font-medium text-text-primary">{item.question}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{item.views}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-xs font-medium ${item.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {item.status === 'PUBLISHED' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{item.createdAt}</td>
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
