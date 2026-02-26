'use client';

import { useState, useEffect } from 'react';
import { Edit2, Eye, Plus, Save, X, Trash2, Clock } from 'lucide-react';

interface ContentArticle {
  id: string;
  slug: string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  content: string;
  status: string;
  publishedAt?: string;
  updatedAt: string;
}

const articleTypes = [
  { value: 'USER_AGREEMENT', label: '用户注册协议' },
  { value: 'PROVIDER_AGREEMENT', label: '服务商注册协议' },
  { value: 'PARTNER_AGREEMENT', label: '销售合伙人协议' },
  { value: 'CONFIDENTIALITY_AGREEMENT', label: '保密协议' },
  { value: 'ANNOUNCEMENT', label: '通知公告' },
  { value: 'KNOWLEDGE_ARTICLE', label: '知识文章/帮助文档' },
  { value: 'FORUM_RULES', label: '论坛协议/规则' },
];

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  ARCHIVED: '已归档',
};

const inputCls =
  'w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-background text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ContentArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editData, setEditData] = useState<Partial<ContentArticle> & { changesSummary?: string }>({});
  const [versions, setVersions] = useState<any[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadArticles();
  }, [typeFilter, statusFilter]);

  const loadArticles = async () => {
    try {
      let url = '/api/admin/articles';
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (params.toString()) url += '?' + params.toString();

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setArticles(data.data);
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = async (article: ContentArticle) => {
    setEditingId(article.id);
    setEditData(article);
    // 加载版本历史
    try {
      const res = await fetch(`/api/admin/articles/${article.id}/versions`);
      const data = await res.json();
      if (data.success) {
        setVersions(data.data);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setVersions([]);
  };

  const saveArticle = async () => {
    if (!editingId) return;
    setSaveLoading(true);
    try {
      const updatePayload = {
        title: editData.title,
        subtitle: editData.subtitle,
        description: editData.description,
        content: editData.content,
        slug: editData.slug,
        status: editData.status,
        changesSummary: editData.changesSummary || '文章已更新',
      };

      const res = await fetch(`/api/admin/articles/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const data = await res.json();
      if (data.success) {
        setArticles((prev) =>
          prev.map((a) => (a.id === editingId ? { ...a, ...editData } : a))
        );
        setEditingId(null);
        setEditData({});
        setVersions([]);
        alert('✅ 文章已更新');
        loadArticles();
      } else {
        alert('❌ 更新失败: ' + data.error);
      }
    } catch (error) {
      alert('❌ 更新失败: ' + error);
    } finally {
      setSaveLoading(false);
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm('确定要删除此文章吗？')) return;
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
        alert('✅ 文章已删除');
      } else {
        alert('❌ 删除失败: ' + data.error);
      }
    } catch (error) {
      alert('❌ 删除失败: ' + error);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-text-muted">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">内容管理</h1>
          <p className="text-text-secondary mt-1">管理服务文章、协议和知识库</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0a7c71] transition-colors font-medium"
        >
          <Plus size={18} /> 新建文章
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-card border border-card-border rounded-lg p-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={inputCls + ' flex-1'}
        >
          <option value="">全部文章类型</option>
          {articleTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={inputCls + ' flex-1'}
        >
          <option value="">全部状态</option>
          <option value="DRAFT">草稿</option>
          <option value="PUBLISHED">已发布</option>
          <option value="ARCHIVED">已归档</option>
        </select>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        {articles.length === 0 ? (
          <div className="text-center py-12 text-text-muted">没有找到文章</div>
        ) : (
          articles.map((article) => (
            <div
              key={article.id}
              className="bg-card border border-card-border rounded-xl overflow-hidden"
            >
              {editingId === article.id ? (
                // Edit Mode
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">文章标题</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={editData.title || ''}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">URL Slug</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={editData.slug || ''}
                        onChange={(e) => setEditData({ ...editData, slug: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-text-muted mb-1">副标题</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={editData.subtitle || ''}
                      onChange={(e) => setEditData({ ...editData, subtitle: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-muted mb-1">文章摘要</label>
                    <textarea
                      className={inputCls + ' min-h-[60px]'}
                      value={editData.description || ''}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-muted mb-1">文章内容 (HTML)</label>
                    <textarea
                      className={inputCls + ' font-mono min-h-[300px]'}
                      value={editData.content || ''}
                      onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                      placeholder="输入HTML内容..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">文章类型</label>
                      <select
                        className={inputCls}
                        value={editData.type || ''}
                        disabled
                      >
                        {articleTypes.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">状态</label>
                      <select
                        className={inputCls}
                        value={editData.status || 'DRAFT'}
                        onChange={(e) =>
                          setEditData({ ...editData, status: e.target.value })
                        }
                      >
                        <option value="DRAFT">草稿</option>
                        <option value="PUBLISHED">已发布</option>
                        <option value="ARCHIVED">已归档</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-text-muted mb-1">变更说明</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={editData.changesSummary || ''}
                      placeholder="描述本次的变更内容"
                      onChange={(e) =>
                        setEditData({ ...editData, changesSummary: e.target.value })
                      }
                    />
                  </div>

                  {/* Version History */}
                  {versions.length > 0 && (
                    <div className="bg-gray-50 dark:bg-white/5 p-3 rounded border border-border-primary">
                      <p className="text-xs text-text-muted mb-2 flex items-center gap-1">
                        <Clock size={14} /> 版本历史
                      </p>
                      <div className="space-y-1 max-h-[120px] overflow-y-auto">
                        {versions.map((v) => (
                          <div key={v.version} className="text-xs text-text-secondary">
                            版本 {v.version}: {v.changesSummary} ({new Date(v.createdAt).toLocaleDateString()})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={saveArticle}
                      disabled={saveLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#0d9488] text-white text-sm rounded-lg hover:bg-[#0a7c71] transition-colors font-medium disabled:opacity-50"
                    >
                      <Save size={16} /> {saveLoading ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 px-4 py-2 bg-white dark:bg-[#1e1e1e] text-text-secondary border border-border-primary text-sm rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">{article.title}</h3>
                      {article.subtitle && (
                        <p className="text-sm text-text-secondary mt-1">{article.subtitle}</p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        statusColors[article.status]
                      }`}
                    >
                      {statusLabels[article.status]}
                    </span>
                  </div>

                  <div className="text-xs text-text-muted mb-2">
                    {articleTypes.find((t) => t.value === article.type)?.label} •{' '}
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString()
                      : '未发布'}
                  </div>

                  {article.description && (
                    <p className="text-sm text-text-secondary mb-3">{article.description}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(article)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#0d9488]/10 text-[#0d9488] text-sm rounded-lg hover:bg-[#0d9488]/20 transition-colors font-medium"
                    >
                      <Edit2 size={14} /> 编辑
                    </button>
                    <button
                      onClick={() => setPreviewId(previewId === article.id ? null : article.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-white/10 text-text-secondary text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      <Eye size={14} /> {previewId === article.id ? '隐藏' : '预览'}
                    </button>
                    <button
                      onClick={() => deleteArticle(article.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-500/10 text-red-600 text-sm rounded-lg hover:bg-red-200 transition-colors font-medium"
                    >
                      <Trash2 size={14} /> 删除
                    </button>
                  </div>

                  {/* Preview Mode */}
                  {previewId === article.id && (
                    <div className="mt-4 border border-border-primary rounded p-4 bg-gray-50 dark:bg-white/5">
                      <p className="text-xs text-text-muted mb-2">预览:</p>
                      <div
                        className="bg-white dark:bg-[#1a1a1a] p-4 rounded border border-border-primary text-text-primary prose dark:prose-invert prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
