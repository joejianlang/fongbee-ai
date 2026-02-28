'use client';

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react';
import {
  Search, Plus, Edit2, Trash2, X, Loader,
  ToggleLeft, ToggleRight, Tag, Info,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────────── */
interface NewsCategory {
  id:           string;
  name:         string;
  icon:         string | null;
  color:        string | null;
  description:  string | null;
  keywords:     string | null;    // JSON string
  filterType:   string;
  displayOrder: number;
  isActive:     boolean;
  newsCount:    number;
  createdAt:    string;
}

const FILTER_TYPE_OPTIONS = [
  { value: 'KEYWORDS',       label: '关键词匹配',    desc: '通过关键词在文章标签中自动匹配' },
  { value: 'ALL',            label: '全部内容',      desc: '显示所有内容，不做过滤' },
  { value: 'USER_INTERESTS', label: '用户关注',      desc: '基于用户兴趣标签个性化推荐' },
  { value: 'RSS_SOURCE',     label: 'RSS媒体',       desc: '仅显示RSS订阅来源的内容' },
  { value: 'YOUTUBE_SOURCE', label: 'YouTube频道',   desc: '仅显示YouTube来源的视频内容' },
];

const EMOJI_OPTIONS = [
  '📰','▶️','💻','📱','📊','🏙️','🎬','🎵','🎮','⚽',
  '🍔','🏥','✈️','🏠','👗','💼','🎓','📚','🌍','🚗',
  '🔥','💡','🎯','🌐','📡','🏦','🎨','⚡','🧬','🌿',
];

const DEFAULT_FORM = {
  name: '', icon: '📰', description: '', keywords: [] as string[], filterType: 'KEYWORDS',
};

/* ── Component ─────────────────────────────────────────────────────────── */
export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving,  setSaving]        = useState(false);
  const [search,  setSearch]        = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [formData,    setFormData]    = useState(DEFAULT_FORM);
  const [kwInput,     setKwInput]     = useState('');   // tag input buffer
  const [error,       setError]       = useState<string | null>(null);
  const kwRef = useRef<HTMLInputElement>(null);

  /* ── Fetch ──────────────────────────────────────────────────────────── */
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/news-categories?all=true');
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  /* ── Derived ────────────────────────────────────────────────────────── */
  const stats = {
    total:  categories.length,
    active: categories.filter((c) => c.isActive).length,
    news:   categories.reduce((s, c) => s + (c.newsCount ?? 0), 0),
  };
  const filtered = categories.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Modal ──────────────────────────────────────────────────────────── */
  const openModal = (cat?: NewsCategory) => {
    setError(null);
    setKwInput('');
    if (cat) {
      setEditingId(cat.id);
      let kws: string[] = [];
      try { kws = cat.keywords ? JSON.parse(cat.keywords) : []; } catch {}
      setFormData({
        name:        cat.name,
        icon:        cat.icon        ?? '📰',
        description: cat.description ?? '',
        keywords:    kws,
        filterType:  cat.filterType  ?? 'KEYWORDS',
      });
    } else {
      setEditingId(null);
      setFormData(DEFAULT_FORM);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(DEFAULT_FORM);
    setKwInput('');
    setError(null);
  };

  /* ── Keyword tag input ──────────────────────────────────────────────── */
  const commitKw = () => {
    const val = kwInput.trim().replace(/^[,，、\s]+|[,，、\s]+$/g, '');
    if (!val) return;
    // Support comma/space/enter separation
    const parts = val.split(/[,，、\s]+/).filter(Boolean);
    const merged = [...new Set([...formData.keywords, ...parts])];
    setFormData((f) => ({ ...f, keywords: merged }));
    setKwInput('');
  };

  const onKwKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === '，') {
      e.preventDefault();
      commitKw();
    } else if (e.key === 'Backspace' && !kwInput && formData.keywords.length > 0) {
      setFormData((f) => ({ ...f, keywords: f.keywords.slice(0, -1) }));
    }
  };

  const removeKw = (kw: string) =>
    setFormData((f) => ({ ...f, keywords: f.keywords.filter((k) => k !== kw) }));

  /* ── CRUD ───────────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Commit any pending keyword text
    const pendingParts = kwInput.trim().split(/[,，、\s]+/).filter(Boolean);
    const finalKeywords = [...new Set([...formData.keywords, ...pendingParts])];

    if (!formData.name.trim()) { setError('请输入分类名称'); return; }
    setSaving(true);
    setError(null);
    try {
      const url    = editingId ? `/api/news-categories/${editingId}` : '/api/news-categories';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        formData.name.trim(),
          icon:        formData.icon        || null,
          description: formData.description || null,
          keywords:    finalKeywords,
          filterType:  formData.filterType,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? '操作失败'); return; }
      closeModal();
      fetchCategories();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: NewsCategory) => {
    try {
      await fetch(`/api/news-categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      setCategories((prev) =>
        prev.map((c) => c.id === cat.id ? { ...c, isActive: !c.isActive } : c)
      );
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此分类？分类下的文章不会被删除，但将不再归属此分类。')) return;
    try {
      await fetch(`/api/news-categories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (e) { console.error(e); }
  };

  /* ── Helpers ────────────────────────────────────────────────────────── */
  const filterLabel = (ft: string) =>
    FILTER_TYPE_OPTIONS.find((o) => o.value === ft)?.label ?? ft;

  const parseKw = (raw: string | null): string[] => {
    try { return raw ? JSON.parse(raw) : []; } catch { return []; }
  };

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">分类管理</h1>
          <p className="text-text-secondary mt-1">
            配置新闻分类及关键词，AI 通过关键词自动归类文章，前端即时生效
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0d9488] text-white rounded-lg font-medium hover:bg-[#0a7c71] transition-colors"
        >
          <Plus size={18} /> 新增分类
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: '总分类', value: stats.total,  color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: '已激活', value: stats.active,  color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: '文章总数', value: stats.news,  color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map((c) => (
          <div key={c.label} className={`${c.bg} rounded-xl px-5 py-4`}>
            <p className={`text-2xl font-bold ${c.color}`}>{loading ? '—' : c.value}</p>
            <p className="text-sm text-text-secondary">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索分类..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-card-border rounded-lg bg-card text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="animate-spin text-[#0d9488]" size={28} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-border bg-gray-50/50 dark:bg-white/[.02]">
                  {['分类名称', '描述 / 关键词', '过滤策略', '文章数', '状态', '操作'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-text-muted">
                      {search ? '未找到匹配的分类' : '暂无分类，点击「新增分类」添加'}
                    </td>
                  </tr>
                ) : filtered.map((cat) => {
                  const kws = parseKw(cat.keywords);
                  return (
                    <tr key={cat.id} className="border-b border-card-border last:border-0 hover:bg-black/[.02] dark:hover:bg-white/[.03]">
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {cat.icon && <span className="text-xl leading-none">{cat.icon}</span>}
                          <span className="font-medium text-text-primary">{cat.name}</span>
                        </div>
                      </td>

                      {/* Description + keywords */}
                      <td className="px-5 py-3.5 max-w-[280px]">
                        {cat.description && (
                          <p className="text-xs text-text-secondary mb-1.5 line-clamp-1">{cat.description}</p>
                        )}
                        {kws.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {kws.slice(0, 6).map((kw) => (
                              <span key={kw} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#0d9488]/10 text-[#0d9488] text-[11px] font-medium">
                                <Tag size={9} /> {kw}
                              </span>
                            ))}
                            {kws.length > 6 && (
                              <span className="text-[11px] text-text-muted px-1">+{kws.length - 6}</span>
                            )}
                          </div>
                        )}
                        {!cat.description && kws.length === 0 && (
                          <span className="text-xs text-text-muted italic">未配置</span>
                        )}
                      </td>

                      {/* Filter type badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium">
                          {filterLabel(cat.filterType)}
                        </span>
                      </td>

                      {/* Article count */}
                      <td className="px-5 py-3.5">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-text-secondary">
                          {cat.newsCount ?? 0}
                        </span>
                      </td>

                      {/* Active toggle */}
                      <td className="px-5 py-3.5">
                        <button onClick={() => handleToggleActive(cat)} className="flex items-center gap-1.5 text-sm" title={cat.isActive ? '点击禁用' : '点击激活'}>
                          {cat.isActive ? (
                            <><ToggleRight size={22} className="text-green-500" /><span className="text-green-600 font-medium text-xs">已激活</span></>
                          ) : (
                            <><ToggleLeft size={22} className="text-gray-400" /><span className="text-text-muted text-xs">已禁用</span></>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1">
                          <button onClick={() => openModal(cat)} className="p-1.5 rounded hover:bg-card-border/50 text-text-muted hover:text-text-primary transition-colors" title="编辑">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-text-muted hover:text-red-600 transition-colors" title="删除">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-card border border-card-border rounded-xl w-full max-w-lg shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-card-border">
              <h2 className="text-lg font-bold text-text-primary">
                {editingId ? '编辑分类' : '新增分类'}
              </h2>
              <button onClick={closeModal} className="p-1 rounded hover:bg-card-border transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  分类名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" value={formData.name} autoFocus
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例：科技、财经、本地新闻…"
                  className="w-full px-3 py-2.5 text-sm border border-card-border rounded-lg bg-background text-text-primary outline-none focus:ring-2 focus:ring-[#0d9488]/40"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  分类说明
                  <span className="ml-1.5 text-xs font-normal text-text-muted">（帮助 AI 理解该分类的范围）</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="例：涵盖人工智能、芯片、软件等科技领域内容…"
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-card-border rounded-lg bg-background text-text-primary outline-none focus:ring-2 focus:ring-[#0d9488]/40 resize-none"
                />
              </div>

              {/* Filter Type */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  过滤策略
                  <span className="ml-1.5 text-xs font-normal text-text-muted">（决定如何筛选文章）</span>
                </label>
                <div className="space-y-2">
                  {FILTER_TYPE_OPTIONS.map((opt) => (
                    <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.filterType === opt.value
                        ? 'border-[#0d9488] bg-[#0d9488]/5'
                        : 'border-card-border hover:border-[#0d9488]/40'
                    }`}>
                      <input
                        type="radio" name="filterType" value={opt.value}
                        checked={formData.filterType === opt.value}
                        onChange={() => setFormData({ ...formData, filterType: opt.value })}
                        className="mt-0.5 accent-[#0d9488]"
                      />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                        <p className="text-xs text-text-muted mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Keywords — only shown for KEYWORDS filter type */}
              {formData.filterType === 'KEYWORDS' && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    匹配关键词
                    <span className="ml-1.5 text-xs font-normal text-text-muted">（AI 用这些词标记文章）</span>
                  </label>
                  {/* Tag input box */}
                  <div
                    className="min-h-[80px] w-full px-3 py-2 border border-card-border rounded-lg bg-background focus-within:ring-2 focus-within:ring-[#0d9488]/40 cursor-text flex flex-wrap gap-1.5 items-start"
                    onClick={() => kwRef.current?.focus()}
                  >
                    {formData.keywords.map((kw) => (
                      <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0d9488]/10 text-[#0d9488] text-xs font-medium shrink-0">
                        {kw}
                        <button type="button" onClick={() => removeKw(kw)} className="hover:text-red-500 transition-colors">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                    <input
                      ref={kwRef}
                      value={kwInput}
                      onChange={(e) => setKwInput(e.target.value)}
                      onKeyDown={onKwKey}
                      onBlur={commitKw}
                      placeholder={formData.keywords.length === 0 ? '输入关键词，按 Enter 或逗号确认…' : ''}
                      className="flex-1 min-w-[120px] text-sm bg-transparent text-text-primary outline-none placeholder-text-muted py-0.5"
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">
                    <Info size={11} />
                    支持中英文，按 Enter、逗号或失去焦点自动添加；Backspace 删除最后一个
                  </p>
                </div>
              )}

              {/* Icon picker */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">图标（可选）</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button key={emoji} type="button" onClick={() => setFormData({ ...formData, icon: emoji })}
                      className={`p-2 rounded-lg text-xl border-2 transition-all ${
                        formData.icon === emoji
                          ? 'border-[#0d9488] bg-[#0d9488]/10 scale-110'
                          : 'border-card-border hover:border-[#0d9488]/50'
                      }`}>
                      {emoji}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setFormData({ ...formData, icon: '' })}
                  className="mt-1.5 text-xs text-text-muted hover:text-text-primary">
                  清除图标
                </button>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
              )}

              {/* Footer */}
              <div className="flex gap-3 pt-2 border-t border-card-border">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-card-border text-text-primary font-medium hover:bg-card-border/50 transition-colors">
                  取消
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#0d9488] text-white font-medium hover:bg-[#0a7c71] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <Loader size={14} className="animate-spin" />}
                  {editingId ? '保存修改' : '新增分类'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
