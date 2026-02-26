'use client';

import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Eye } from 'lucide-react';

interface AINews {
  id: string;
  title: string;
  source: string;
  views: number;
  status: 'PUBLISHED' | 'DRAFT';
  publishedAt: string;
}

const MOCK_NEWS: AINews[] = [
  { id: 'AN001', title: 'ChatGPT 推出新功能', source: 'TechCrunch', views: 3456, status: 'PUBLISHED', publishedAt: '2025-12-14' },
  { id: 'AN002', title: '企业AI应用趋势分析', source: 'Forbes', views: 2145, status: 'PUBLISHED', publishedAt: '2025-12-12' },
  { id: 'AN003', title: 'AI在服务业的应用', source: '新浪科技', views: 1823, status: 'PUBLISHED', publishedAt: '2025-12-10' },
  { id: 'AN004', title: 'AI伦理与监管新动向', source: 'AI Times', views: 0, status: 'DRAFT', publishedAt: '2025-12-15' },
  { id: 'AN005', title: '2025年AI市场展望', source: '行业观察', views: 892, status: 'PUBLISHED', publishedAt: '2025-12-08' },
];

export default function AINewsPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_NEWS.filter((n) =>
    !search || n.title.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: MOCK_NEWS.length,
    published: MOCK_NEWS.filter((n) => n.status === 'PUBLISHED').length,
    totalViews: MOCK_NEWS.reduce((sum, n) => sum + n.views, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">AI 新闻管理</h1>
          <p className="text-text-secondary mt-1">发布和管理 AI 相关新闻</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0d9488] text-white rounded-lg font-medium hover:bg-[#0a7c71]">
          <Plus size={18} />
          发布新闻
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '总新闻', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '已发布', value: stats.published, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '总阅读', value: stats.totalViews, color: 'text-purple-600', bg: 'bg-purple-50' },
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
          placeholder="搜索新闻..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-card-border rounded-lg bg-card text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40"
        />
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-card-border bg-opacity-50">
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">标题</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">来源</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">阅读量</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">状态</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">发布时间</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                  未找到匹配的新闻
                </td>
              </tr>
            ) : (
              filtered.map((news) => (
                <tr key={news.id} className="border-b border-card-border hover:bg-opacity-50">
                  <td className="px-6 py-4 font-medium text-text-primary">{news.title}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{news.source}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-text-secondary">
                      <Eye size={14} />
                      {news.views}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-xs font-medium ${news.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {news.status === 'PUBLISHED' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{news.publishedAt}</td>
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
