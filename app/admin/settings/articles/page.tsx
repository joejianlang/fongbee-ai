'use client';

import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, Clock } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  author: string;
  category: string;
  views: number;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  publishedAt: string;
}

const MOCK_ARTICLES: Article[] = [
  {
    id: 'ART001',
    title: '如何选择合适的清洁服务',
    author: '管理员',
    category: '家政清洁',
    views: 1256,
    status: 'PUBLISHED',
    publishedAt: '2025-12-10',
  },
  {
    id: 'ART002',
    title: '搬家指南：省钱又省心',
    author: '编辑部',
    category: '搬家服务',
    views: 892,
    status: 'PUBLISHED',
    publishedAt: '2025-12-08',
  },
  {
    id: 'ART003',
    title: '家庭装修常见问题解答',
    author: '专家',
    category: '房屋维修',
    views: 654,
    status: 'PUBLISHED',
    publishedAt: '2025-12-05',
  },
  {
    id: 'ART004',
    title: '服务商入驻流程详解',
    author: '管理员',
    category: '平台介绍',
    views: 0,
    status: 'DRAFT',
    publishedAt: '2025-12-15',
  },
  {
    id: 'ART005',
    title: '2025年服务平台新功能发布',
    author: '编辑部',
    category: '公告',
    views: 2341,
    status: 'PUBLISHED',
    publishedAt: '2025-12-01',
  },
];

export default function ArticlesManagementPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_ARTICLES.filter((a) => {
    const matchSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.author.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const stats = {
    total: MOCK_ARTICLES.length,
    published: MOCK_ARTICLES.filter((a) => a.status === 'PUBLISHED').length,
    totalViews: MOCK_ARTICLES.reduce((sum, a) => sum + a.views, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">原创文章管理</h1>
          <p className="text-text-secondary mt-1">编辑和发布原创文章内容</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0d9488] text-white rounded-lg font-medium hover:bg-[#0a7c71] transition-colors">
          <Plus size={18} />
          新写文章
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: '总文章数', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '已发布', value: stats.published, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '总浏览量', value: stats.totalViews, color: 'text-purple-600', bg: 'bg-purple-50' },
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
          placeholder="搜索文章..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-card-border rounded-lg bg-card text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40"
        />
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border bg-opacity-50">
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">标题</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">作者</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">分类</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">浏览量</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">状态</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">发布时间</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                    未找到匹配的文章
                  </td>
                </tr>
              ) : (
                filtered.map((article) => (
                  <tr key={article.id} className="border-b border-card-border hover:bg-opacity-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-text-primary max-w-xs truncate">{article.title}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{article.author}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{article.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-text-secondary">
                        <Eye size={14} />
                        {article.views}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${article.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : article.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                        {article.status === 'PUBLISHED' ? '已发布' : article.status === 'DRAFT' ? '草稿' : '已归档'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{article.publishedAt}</td>
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
