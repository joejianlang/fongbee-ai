'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

type ReqStatus = '全部' | '待审核' | '已接单' | '进行中' | '已完成' | '已拒绝';

interface CustomRequest {
  id: string;
  title: string;
  customer: string;
  description: string;
  budget: string;
  status: '待审核' | '已接单' | '进行中' | '已完成' | '已拒绝';
  createdAt: string;
  provider?: string;
}

const MOCK_REQUESTS: CustomRequest[] = [
  {
    id: '#REQ-001',
    title: '搬家整理服务',
    customer: 'Alice Wang',
    description: '需要整理三居室搬家，包含打包、运输和归位，约需要8小时。',
    budget: '$400–600',
    status: '待审核',
    createdAt: '2026-02-24',
  },
  {
    id: '#REQ-002',
    title: '深度清洁+家具翻新',
    customer: 'Bob Zhang',
    description: '家中约1500平方英尺需要深度清洁，另有3把椅子需要重新包覆。',
    budget: '$800–1200',
    status: '已接单',
    createdAt: '2026-02-23',
    provider: '李师傅团队',
  },
  {
    id: '#REQ-003',
    title: '办公室IT设备安装',
    customer: 'Carol Liu',
    description: '新办公室共15台电脑需要安装配置，包含网络布线。',
    budget: '$600–900',
    status: '进行中',
    createdAt: '2026-02-22',
    provider: '张技术',
  },
  {
    id: '#REQ-004',
    title: '庭院景观设计施工',
    customer: 'David Chen',
    description: '300平米庭院需要全面景观改造，含种植草坪、灌木和铺设路砖。',
    budget: '$3000–5000',
    status: '已完成',
    createdAt: '2026-02-18',
    provider: '绿拇指园艺',
  },
  {
    id: '#REQ-005',
    title: '儿童房粉刷装饰',
    customer: 'Emma Zhou',
    description: '一间儿童卧室需要粉刷并绘制主题壁画（太空主题）。',
    budget: '$250–400',
    status: '已拒绝',
    createdAt: '2026-02-20',
  },
];

const STATUS_CONFIG: Record<CustomRequest['status'], { label: string; color: string; icon: React.ReactNode }> = {
  '待审核': { label: '待审核', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={12} /> },
  '已接单': { label: '已接单', color: 'bg-blue-100 text-blue-700',   icon: <CheckCircle size={12} /> },
  '进行中': { label: '进行中', color: 'bg-purple-100 text-purple-700', icon: <AlertCircle size={12} /> },
  '已完成': { label: '已完成', color: 'bg-green-100 text-green-700',  icon: <CheckCircle size={12} /> },
  '已拒绝': { label: '已拒绝', color: 'bg-red-100 text-red-500',      icon: <XCircle size={12} /> },
};

export default function CustomRequestsPage() {
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState<ReqStatus>('全部');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = MOCK_REQUESTS.filter((r) => {
    const matchStatus = status === '全部' || r.status === status;
    const matchSearch = !search ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.customer.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">定制需求</h1>
        <p className="text-text-secondary mt-1">审核客户提交的个性化服务需求</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索需求编号 / 标题 / 客户..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-card-border rounded-lg bg-card text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['全部', '待审核', '已接单', '进行中', '已完成', '已拒绝'] as ReqStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                status === s
                  ? 'bg-[#0d9488] text-white'
                  : 'bg-card border border-card-border text-text-secondary hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-card border border-card-border rounded-xl px-6 py-12 text-center text-text-muted">暂无数据</div>
        ) : (
          filtered.map((req) => {
            const cfg       = STATUS_CONFIG[req.status];
            const isExpanded = expanded === req.id;
            return (
              <div key={req.id} className="bg-card border border-card-border rounded-xl overflow-hidden">
                {/* Card Header Row */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : req.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-text-muted">{req.id}</span>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </div>
                    <p className="mt-0.5 font-semibold text-text-primary text-sm">{req.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {req.customer} · {req.createdAt}
                      {req.provider && <> · 接单：<span className="text-[#0d9488]">{req.provider}</span></>}
                    </p>
                  </div>
                  <div className="text-sm font-bold text-text-primary whitespace-nowrap">{req.budget}</div>
                  {isExpanded ? <ChevronUp size={16} className="text-text-muted flex-shrink-0" /> : <ChevronDown size={16} className="text-text-muted flex-shrink-0" />}
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-card-border px-5 py-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-text-secondary mb-1">需求描述</p>
                      <p className="text-sm text-text-primary">{req.description}</p>
                    </div>
                    {req.status === '待审核' && (
                      <div className="flex gap-2">
                        <button className="flex-1 py-2 text-sm font-medium bg-[#0d9488] text-white rounded-lg hover:bg-[#0a7c71] transition-colors">
                          ✓ 通过审核
                        </button>
                        <button className="flex-1 py-2 text-sm font-medium border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                          ✗ 拒绝
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
