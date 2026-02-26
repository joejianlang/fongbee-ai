'use client';

import { useState } from 'react';
import { Search, Edit2, Trash2, Flag, ThumbsUp } from 'lucide-react';

interface CommunityContent {
  id: string;
  author: string;
  title: string;
  type: string;
  likes: number;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

const MOCK_CONTENT: CommunityContent[] = [
  { id: 'CC001', author: '用户张三', title: '求推荐靠谱的清洁服务', type: '提问', likes: 45, status: 'APPROVED', createdAt: '2025-12-14' },
  { id: 'CC002', author: '用户李四', title: '分享搬家经验', type: '分享', likes: 78, status: 'APPROVED', createdAt: '2025-12-13' },
  { id: 'CC003', author: '用户王五', title: '求助：装修质量问题', type: '提问', likes: 12, status: 'PENDING', createdAt: '2025-12-15' },
  { id: 'CC004', author: '用户赵六', title: '广告内容', type: '其他', likes: 0, status: 'REJECTED', createdAt: '2025-12-12' },
];

export default function CommunityContentPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_CONTENT.filter((c) =>
    !search || c.author.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: MOCK_CONTENT.length,
    approved: MOCK_CONTENT.filter((c) => c.status === 'APPROVED').length,
    pending: MOCK_CONTENT.filter((c) => c.status === 'PENDING').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">社区内容管理</h1>
        <p className="text-text-secondary mt-1">管理用户生成的社区内容</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '总内容', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '已批准', value: stats.approved, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '待审核', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
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
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">作者</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">标题</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">类型</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">点赞</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">状态</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">创建时间</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                  未找到匹配的内容
                </td>
              </tr>
            ) : (
              filtered.map((content) => (
                <tr key={content.id} className="border-b border-card-border hover:bg-opacity-50">
                  <td className="px-6 py-4 text-sm text-text-primary">{content.author}</td>
                  <td className="px-6 py-4 text-sm font-medium text-text-primary max-w-xs truncate">{content.title}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{content.type}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm">
                      <ThumbsUp size={14} className="text-blue-600" />
                      <span className="text-text-primary">{content.likes}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-xs font-medium ${content.status === 'APPROVED' ? 'bg-green-100 text-green-700' : content.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {content.status === 'APPROVED' ? '已批准' : content.status === 'PENDING' ? '待审核' : '已拒绝'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{content.createdAt}</td>
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
