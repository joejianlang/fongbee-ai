'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Rss, Youtube, Plus, Trash2, RefreshCw, CheckCircle2,
  XCircle, Clock, AlertCircle, Loader2, Play, Database,
} from 'lucide-react';

type FeedType = 'RSS' | 'YOUTUBE';
type SourceStatus = 'all' | 'active' | 'inactive';

interface FeedSource {
  id: string;
  name: string;
  type: FeedType;
  url: string;
  isActive: boolean;
  crawlCron: string;
  lastCrawledAt: string | null;
  nextCrawlAt: string | null;
  errorCount: number;
  lastErrorMsg: string | null;
  _count: { articles: number };
}

const CRON_PRESETS = [
  { label: '每30分钟', value: '*/30 * * * *' },
  { label: '每小时',   value: '0 * * * *' },
  { label: '每2小时',  value: '0 */2 * * *' },
  { label: '每6小时',  value: '0 */6 * * *' },
  { label: '每12小时', value: '0 */12 * * *' },
  { label: '每天',     value: '0 0 * * *' },
];

function relativeTime(iso: string | null): string {
  if (!iso) return '从未';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}

function nextTime(iso: string | null): string {
  if (!iso) return '未安排';
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return '即将执行';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟后`;
  return `${Math.floor(diff / 3600000)} 小时后`;
}

export default function FeedSourcesPage() {
  const [sources, setSources]       = useState<FeedSource[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SourceStatus>('all');
  const [typeFilter, setTypeFilter]     = useState<'all' | FeedType>('all');
  const [showAddForm, setShowAddForm]   = useState(false);
  const [crawling, setCrawling]     = useState<string | null>(null);
  const [globalCrawling, setGlobalCrawling] = useState(false);

  // New source form state
  const [newName, setNewName]   = useState('');
  const [newType, setNewType]   = useState<FeedType>('RSS');
  const [newUrl, setNewUrl]     = useState('');
  const [newCron, setNewCron]   = useState('0 */6 * * *');
  const [adding, setAdding]         = useState(false);
  const [addError, setAddError]     = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [initMessage,  setInitMessage]  = useState<string | null>(null);

  // ── Load sources from API ────────────────────────────────────────────────
  const loadSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/feed/sources');
      const data = await res.json();
      if (data.success) {
        setSources(data.data ?? []);
      } else {
        setError(data.error ?? data.message ?? '加载失败');
      }
    } catch {
      setError('网络错误，无法加载订阅源');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSources(); }, [loadSources]);

  // ── Computed ─────────────────────────────────────────────────────────────
  const filtered = sources.filter((s) => {
    if (statusFilter === 'active'   && !s.isActive) return false;
    if (statusFilter === 'inactive' &&  s.isActive) return false;
    if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    return true;
  });

  const totalArticles = sources.reduce((n, s) => n + (s._count?.articles ?? 0), 0);
  const activeCount   = sources.filter((s) => s.isActive).length;
  const errorCount    = sources.filter((s) => s.errorCount > 0).length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleToggleActive = async (id: string, current: boolean) => {
    // Optimistic update
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !current } : s))
    );
    try {
      const res  = await fetch(`/api/feed/sources/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ isActive: !current }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? '更新失败');
    } catch {
      // Rollback
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: current } : s))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个订阅源吗？相关文章不会被删除。')) return;
    setSources((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch(`/api/feed/sources/${id}`, { method: 'DELETE' });
    } catch {
      // Reload to get accurate state
      loadSources();
    }
  };

  const handleCrawlOne = async (id: string) => {
    setCrawling(id);
    try {
      // Trigger crawl via cron endpoint (admin session cookie is sent automatically)
      await fetch('/api/cron/crawl-feeds', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ sourceId: id }),
      });
      // Refresh source data to show updated lastCrawledAt
      await loadSources();
    } finally {
      setCrawling(null);
    }
  };

  const handleCrawlAll = async () => {
    setGlobalCrawling(true);
    try {
      // Admin session cookie is sent automatically via credentials: 'include'
      await fetch('/api/cron/crawl-feeds', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
      });
      await loadSources();
    } finally {
      setGlobalCrawling(false);
    }
  };

  const handleInit = async () => {
    if (!confirm('将插入 9 个默认 RSS 来源并修正分类过滤规则，确认继续？')) return;
    setInitializing(true);
    setInitMessage(null);
    try {
      const res  = await fetch('/api/admin/setup-feeds', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setInitMessage(`✅ ${data.message}`);
        loadSources();
      } else {
        setInitMessage(`❌ ${data.error}`);
      }
    } catch {
      setInitMessage('❌ 初始化失败，请重试');
    } finally {
      setInitializing(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newUrl.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const res  = await fetch('/api/feed/sources', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:      newName.trim(),
          type:      newType,
          url:       newUrl.trim(),
          crawlCron: newCron,
          isActive:  true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewName(''); setNewUrl(''); setNewType('RSS'); setNewCron('0 */6 * * *');
        setShowAddForm(false);
        await loadSources(); // Reload to get full source with _count
      } else {
        setAddError(data.error ?? data.message ?? '添加失败');
      }
    } catch {
      setAddError('网络错误，请重试');
    } finally {
      setAdding(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">订阅源管理</h1>
          <p className="text-text-secondary text-sm mt-1">管理 RSS 和 YouTube 新闻来源，配置抓取频率</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleInit}
            disabled={initializing}
            className="flex items-center gap-2 px-4 py-2 border border-[#0d9488] text-[#0d9488] rounded-lg text-sm hover:bg-[#0d9488]/10 transition-colors disabled:opacity-60"
          >
            {initializing ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
            初始化默认来源
          </button>
          <button
            onClick={handleCrawlAll}
            disabled={globalCrawling}
            className="flex items-center gap-2 px-4 py-2 border border-card-border rounded-lg text-sm text-text-secondary hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {globalCrawling ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            立即全部抓取
          </button>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white rounded-lg text-sm font-medium hover:bg-[#0a7c71] transition-colors"
          >
            <Plus size={15} />
            添加订阅源
          </button>
        </div>
      </div>

      {/* Init result banner */}
      {initMessage && (
        <div className={`p-3 rounded-xl text-sm flex items-start gap-2 ${
          initMessage.startsWith('✅')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          <span className="flex-1">{initMessage}</span>
          <button onClick={() => setInitMessage(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '订阅源总数', value: sources.length,  color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: '活跃中',     value: activeCount,     color: 'text-green-600', bg: 'bg-green-50' },
          { label: '累计文章数', value: totalArticles,   color: 'text-[#0d9488]', bg: 'bg-teal-50' },
          { label: '有错误',     value: errorCount,      color: 'text-red-600',   bg: 'bg-red-50' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-xl px-5 py-4`}>
            <p className={`text-2xl font-bold ${stat.color}`}>
              {loading ? <span className="inline-block w-6 h-6 bg-gray-200 rounded animate-pulse" /> : stat.value}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Add Source Form */}
      {showAddForm && (
        <div className="bg-card border border-[#0d9488]/30 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
            <Plus size={15} className="text-[#0d9488]" />
            添加新订阅源
          </h3>
          {addError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
              {addError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">来源名称 *</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="如：CBC News"
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg bg-background text-text-primary outline-none focus:ring-2 focus:ring-[#0d9488]/40"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">类型 *</label>
              <div className="flex gap-2">
                {(['RSS', 'YOUTUBE'] as FeedType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm rounded-lg border transition-all ${
                      newType === t
                        ? 'bg-[#0d9488]/10 border-[#0d9488] text-[#0d9488]'
                        : 'border-card-border text-text-secondary hover:border-[#0d9488]/50'
                    }`}
                  >
                    {t === 'RSS' ? <Rss size={14} /> : <Youtube size={14} />}
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">
              {newType === 'RSS' ? 'RSS URL *' : 'YouTube 频道 URL *'}
            </label>
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder={
                newType === 'RSS'
                  ? 'https://www.cbc.ca/cmlink/rss-topstories'
                  : 'https://www.youtube.com/channel/UCxxxxxxxx'
              }
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg bg-background text-text-primary outline-none focus:ring-2 focus:ring-[#0d9488]/40"
            />
            {newType === 'YOUTUBE' && (
              <p className="text-xs text-text-muted mt-1">
                💡 需要在 <code className="bg-gray-100 px-1 rounded">.env</code> 中配置{' '}
                <code className="bg-gray-100 px-1 rounded">YOUTUBE_API_KEY</code>
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">抓取频率</label>
            <div className="flex flex-wrap gap-2">
              {CRON_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setNewCron(p.value)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    newCron === p.value
                      ? 'bg-[#0d9488] text-white border-[#0d9488]'
                      : 'border-card-border text-text-secondary hover:border-[#0d9488]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim() || !newUrl.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-[#0d9488] text-white text-sm font-medium rounded-lg hover:bg-[#0a7c71] transition-colors disabled:opacity-50"
            >
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {adding ? '添加中…' : '确认添加'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setAddError(null); }}
              className="px-5 py-2 border border-card-border text-sm text-text-secondary rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Global error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
          <button onClick={loadSources} className="ml-auto underline text-xs">重试</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'active', 'inactive'] as SourceStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                statusFilter === s ? 'bg-white shadow-sm text-text-primary font-medium' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {s === 'all' ? '全部' : s === 'active' ? '活跃' : '已停用'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'RSS', 'YOUTUBE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                typeFilter === t ? 'bg-white shadow-sm text-text-primary font-medium' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t === 'all' ? '全部类型' : t}
            </button>
          ))}
        </div>
        <span className="text-xs text-text-muted ml-auto">{filtered.length} 个来源</span>
      </div>

      {/* Source List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-card-border rounded-xl p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((source) => (
            <div
              key={source.id}
              className={`bg-card border rounded-xl p-5 transition-all ${
                source.errorCount > 0 ? 'border-red-200' : 'border-card-border'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  source.type === 'RSS' ? 'bg-orange-50' : 'bg-red-50'
                }`}>
                  {source.type === 'RSS'
                    ? <Rss size={18} className="text-orange-500" />
                    : <Youtube size={18} className="text-red-500" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-text-primary text-sm">{source.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      source.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {source.isActive ? '活跃' : '已停用'}
                    </span>
                    {source.errorCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle size={10} />
                        {source.errorCount} 次错误
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted truncate max-w-sm">{source.url}</p>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock size={11} />
                      上次抓取：{relativeTime(source.lastCrawledAt)}
                    </span>
                    <span className="text-xs text-text-muted">
                      下次抓取：{nextTime(source.nextCrawlAt)}
                    </span>
                    <span className="text-xs text-[#0d9488] font-medium">
                      {source._count?.articles ?? 0} 篇文章
                    </span>
                  </div>

                  {/* Error Message */}
                  {source.lastErrorMsg && (
                    <p className="text-xs text-red-500 mt-1.5 bg-red-50 px-2 py-1 rounded">
                      ⚠️ {source.lastErrorMsg}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCrawlOne(source.id)}
                    disabled={crawling === source.id || !source.isActive}
                    title="立即抓取"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-card-border text-text-muted hover:text-[#0d9488] hover:border-[#0d9488] transition-all disabled:opacity-40"
                  >
                    {crawling === source.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Play size={13} />
                    }
                  </button>
                  <button
                    onClick={() => handleToggleActive(source.id, source.isActive)}
                    title={source.isActive ? '停用' : '启用'}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${
                      source.isActive
                        ? 'border-green-200 text-green-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                        : 'border-card-border text-text-muted hover:text-green-600 hover:border-green-200'
                    }`}
                  >
                    {source.isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  </button>
                  <button
                    onClick={() => handleDelete(source.id)}
                    title="删除"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-card-border text-text-muted hover:text-red-500 hover:border-red-200 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-16 text-text-muted">
              <Rss size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{error ? '加载失败' : '暂无订阅源'}</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-3 text-[#0d9488] text-xs underline"
              >
                添加第一个订阅源
              </button>
            </div>
          )}
        </div>
      )}

      {/* Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">📖 快速指引</h4>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs text-blue-700">
          <div>✅ RSS：直接填入 RSS Feed URL，无需 API Key</div>
          <div>🔑 YouTube：需在 <code className="bg-blue-100 px-1 rounded">.env</code> 配置 <code className="bg-blue-100 px-1 rounded">YOUTUBE_API_KEY</code></div>
          <div>⏱ 抓取频率：建议新闻类 2h，YouTube 类 6h</div>
          <div>🔑 Cron 触发：POST <code className="bg-blue-100 px-1 rounded">/api/cron/crawl-feeds</code>，需携带 <code className="bg-blue-100 px-1 rounded">x-cron-key</code></div>
        </div>
      </div>
    </div>
  );
}
