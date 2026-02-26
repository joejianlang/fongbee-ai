'use client';

import { useState } from 'react';
import { Search, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Advertisement {
  id: string;
  title: string;
  advertiser: string;
  budget: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

const MOCK_ADS: Advertisement[] = [
  { id: 'AD001', title: '新年优惠活动', advertiser: '清洁公司A', budget: 500, status: 'PENDING', submittedAt: '2025-12-15' },
  { id: 'AD002', title: '搬家服务推广', advertiser: '搬家服务B', budget: 300, status: 'APPROVED', submittedAt: '2025-12-14' },
  { id: 'AD003', title: '家装维修特惠', advertiser: '维修公司C', budget: 800, status: 'REJECTED', submittedAt: '2025-12-13' },
  { id: 'AD004', title: '美发节目活动', advertiser: '美容店D', budget: 200, status: 'APPROVED', submittedAt: '2025-12-12' },
  { id: 'AD005', title: '教育课程招生', advertiser: '培训机构E', budget: 600, status: 'PENDING', submittedAt: '2025-12-11' },
];

export default function AdsReviewPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_ADS.filter((a) =>
    !search ||
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.advertiser.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    pending: MOCK_ADS.filter((a) => a.status === 'PENDING').length,
    approved: MOCK_ADS.filter((a) => a.status === 'APPROVED').length,
    rejected: MOCK_ADS.filter((a) => a.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">广告审核</h1>
        <p className="text-text-secondary mt-1">审核和管理广告内容</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '待审核', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: '已批准', value: stats.approved, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '已拒绝', value: stats.rejected, color: 'text-red-600', bg: 'bg-red-50' },
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
          placeholder="搜索广告..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-card-border rounded-lg bg-card text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40"
        />
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-card-border bg-opacity-50">
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">广告标题</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">广告商</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">预算</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">状态</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">提交时间</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                  未找到匹配的广告
                </td>
              </tr>
            ) : (
              filtered.map((ad) => (
                <tr key={ad.id} className="border-b border-card-border hover:bg-opacity-50">
                  <td className="px-6 py-4 font-medium text-text-primary">{ad.title}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{ad.advertiser}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">${ad.budget}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {ad.status === 'PENDING' && (
                        <>
                          <Clock size={14} className="text-yellow-600" />
                          <span className="text-xs font-medium text-yellow-600">待审核</span>
                        </>
                      )}
                      {ad.status === 'APPROVED' && (
                        <>
                          <CheckCircle size={14} className="text-green-600" />
                          <span className="text-xs font-medium text-green-600">已批准</span>
                        </>
                      )}
                      {ad.status === 'REJECTED' && (
                        <>
                          <XCircle size={14} className="text-red-600" />
                          <span className="text-xs font-medium text-red-600">已拒绝</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{ad.submittedAt}</td>
                  <td className="px-6 py-4">
                    <button className="text-xs px-3 py-1 rounded bg-[#0d9488]/10 text-[#0d9488] hover:bg-[#0d9488]/20 transition-colors font-medium">
                      查看详情
                    </button>
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
