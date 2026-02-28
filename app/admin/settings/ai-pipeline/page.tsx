'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Zap, CheckCircle2, XCircle, Clock, DollarSign,
  RefreshCw, Play, Loader2, AlertTriangle, BarChart3,
  FileText, Tag, Brain, TrendingUp, Activity, AlertCircle,
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  '本地':       'bg-blue-400',
  '热点':       'bg-orange-400',
  '政治':       'bg-red-400',
  '科技':       'bg-purple-400',
  '财经':       'bg-green-400',
  '体育':       'bg-yellow-400',
  '文化娱乐':   'bg-pink-400',
  'YouTube网红':'bg-red-500',
  '网络专业媒体':'bg-indigo-400',
  '未分类':     'bg-gray-400',
};

interface PipelineStats {
  unprocessed:   number;
  processedToday: number;
  failedToday:   number;
  totalArticles: number;
  categoryDist:  { name: string; count: number }[];
  recent: {
    id:       string;
    title:    string;
    status:   'success' | 'partial' | 'failed';
    category: string | null;
    steps:    { summary: boolean; tags: boolean; sentiment: boolean; embedding: boolean };
  }[];
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000)   return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  return `${Math.floor(diff / 3600000)} 小时前`;
}

export default function AIPipelinePage() {
  const [stats, setStats]         = useState<PipelineStats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [crawling, setCrawling]   = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/admin/pipeline/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error ?? data.message ?? '加载失败');
      }
    } catch {
      setError('网络错误，无法加载流水线数据');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const triggerCrawl = async () => {
    setCrawling(true);
    try {
      await fetch('/api/cron/crawl-feeds', {
        method:  'POST',
        headers: { 'x-cron-key': process.env.NEXT_PUBLIC_CRON_API_KEY ?? '' },
      });
      await loadStats();
    } finally {
      setCrawling(false);
    }
  };

  const triggerProcess = async () => {
    setProcessing(true);
    try {
      await fetch('/api/cron/process-articles', {
        method:  'POST',
        headers: { 'x-cron-key': process.env.NEXT_PUBLIC_CRON_API_KEY ?? '' },
      });
      await loadStats();
    } finally {
      setProcessing(false);
    }
  };

  const maxCount = stats?.categoryDist?.length
    ? Math.max(...stats.categoryDist.map((c) => c.count))
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI 流水线监控</h1>
          <p className="text-text-secondary text-sm mt-1">
            抓取 → AI 摘要 → 标签提取 → 分类映射 → 向量嵌入
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadStats}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-card-border rounded-lg text-sm text-text-secondary hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={triggerCrawl}
            disabled={crawling}
            className="flex items-center gap-2 px-4 py-2 border border-card-border rounded-lg text-sm text-text-secondary hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {crawling ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            触发抓取
          </button>
          <button
            onClick={triggerProcess}
            disabled={processing}
            className="flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white rounded-lg text-sm font-medium hover:bg-[#0a7c71] transition-colors disabled:opacity-50"
          >
            {processing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {processing ? 'AI 处理中…' : '触发 AI 处理'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
          <button onClick={loadStats} className="ml-auto underline text-xs">重试</button>
        </div>
      )}

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-orange-50 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-orange-500" />
            <span className="text-xs text-text-muted">待处理</span>
          </div>
          {loading
            ? <div className="h-8 w-12 bg-orange-200 rounded animate-pulse" />
            : <p className="text-2xl font-bold text-orange-600">{stats?.unprocessed ?? 0}</p>
          }
          <p className="text-xs text-text-muted mt-0.5">篇文章</p>
        </div>
        <div className="bg-green-50 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-green-500" />
            <span className="text-xs text-text-muted">今日已处理</span>
          </div>
          {loading
            ? <div className="h-8 w-12 bg-green-200 rounded animate-pulse" />
            : <p className="text-2xl font-bold text-green-600">{stats?.processedToday ?? 0}</p>
          }
          <p className="text-xs text-text-muted mt-0.5">
            失败 <span className="text-red-500 font-medium">{stats?.failedToday ?? 0}</span>
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-blue-500" />
            <span className="text-xs text-text-muted">今日 AI 成本</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            ~${((stats?.processedToday ?? 0) * 0.000065).toFixed(4)}
          </p>
          <p className="text-xs text-text-muted mt-0.5">按 $0.000065/篇 估算</p>
        </div>
        <div className="bg-teal-50 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-[#0d9488]" />
            <span className="text-xs text-text-muted">累计文章</span>
          </div>
          {loading
            ? <div className="h-8 w-16 bg-teal-200 rounded animate-pulse" />
            : <p className="text-2xl font-bold text-[#0d9488]">{stats?.totalArticles.toLocaleString() ?? 0}</p>
          }
          <p className="text-xs text-text-muted mt-0.5">均 $0.000065/篇</p>
        </div>
      </div>

      {/* Pipeline Flow */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Activity size={15} className="text-[#0d9488]" />
          流水线状态
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { icon: RefreshCw, label: '抓取',    sub: 'crawl-feeds',      color: 'text-blue-500 bg-blue-50' },
            { icon: Brain,     label: 'AI 摘要',  sub: 'processSummary',   color: 'text-purple-500 bg-purple-50' },
            { icon: Tag,       label: '标签提取', sub: 'processTags',      color: 'text-orange-500 bg-orange-50' },
            { icon: BarChart3, label: '情感分析', sub: 'processSentiment', color: 'text-green-500 bg-green-50' },
            { icon: TrendingUp,label: '分类映射', sub: 'categoryMapper',   color: 'text-[#0d9488] bg-teal-50' },
            { icon: Zap,       label: '向量嵌入', sub: 'embedding',        color: 'text-yellow-600 bg-yellow-50' },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-2 flex-shrink-0">
              <div className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl ${step.color} min-w-[80px] text-center`}>
                <step.icon size={18} />
                <span className="text-xs font-semibold">{step.label}</span>
                <span className="text-xs opacity-60">{step.sub}</span>
              </div>
              {i < arr.length - 1 && (
                <span className="text-text-muted text-lg">→</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-card-border text-xs text-text-muted">
          <span>每2小时抓取 · 每15分钟处理10篇</span>
          <span className="ml-auto text-[#0d9488]">
            待处理：{stats?.unprocessed ?? '…'} 篇
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">分类分布</h3>
          {loading ? (
            <div className="space-y-2.5">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-3 w-14 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1 h-2 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-8 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : stats?.categoryDist?.length ? (
            <div className="space-y-2.5">
              {stats.categoryDist.map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-16 text-right flex-shrink-0">{cat.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={`${CATEGORY_COLORS[cat.name] ?? 'bg-gray-400'} h-2 rounded-full transition-all`}
                      style={{ width: `${(cat.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-text-secondary w-10">{cat.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-text-muted text-sm py-8">暂无分类数据</p>
          )}
        </div>

        {/* Recent Processing Log */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">最近处理记录</h3>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
                    <div className="h-2 bg-gray-100 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats?.recent?.length ? (
            <>
              <div className="space-y-2.5">
                {stats.recent.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {item.status === 'success' ? (
                        <CheckCircle2 size={15} className="text-green-500" />
                      ) : item.status === 'partial' ? (
                        <AlertTriangle size={15} className="text-yellow-500" />
                      ) : (
                        <XCircle size={15} className="text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-primary truncate leading-relaxed">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.category && (
                          <span className="text-xs bg-[#0d9488]/10 text-[#0d9488] px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                        )}
                        <div className="flex gap-0.5">
                          {Object.entries(item.steps).map(([k, v]) => (
                            <div
                              key={k}
                              title={k}
                              className={`w-1.5 h-1.5 rounded-full ${v ? 'bg-green-400' : 'bg-red-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted text-center mt-3">
                ● 绿色 = 成功，⚠ 黄色 = 部分失败，✕ 红色 = 全部失败
              </p>
            </>
          ) : (
            <p className="text-center text-text-muted text-sm py-8">暂无处理记录</p>
          )}
        </div>
      </div>

      {/* Cron Setup Guide */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-text-primary mb-3">⚙️ Cron 任务配置（生产环境）</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-gray-900 text-green-400 rounded-lg p-3 space-y-1">
            <p className="text-gray-500"># 每2小时：抓取新内容</p>
            <p>POST /api/cron/crawl-feeds</p>
            <p className="text-gray-500">-H "x-cron-key: $CRON_API_KEY"</p>
          </div>
          <div className="bg-gray-900 text-green-400 rounded-lg p-3 space-y-1">
            <p className="text-gray-500"># 每15分钟：AI 处理（10篇/批）</p>
            <p>POST /api/cron/process-articles</p>
            <p className="text-gray-500">-H "x-cron-key: $CRON_API_KEY"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
