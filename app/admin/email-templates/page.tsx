'use client';

import { useState, useEffect } from 'react';
import { Edit2, Eye, Save, X } from 'lucide-react';
import Pagination from '@/components/Pagination';

interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  description?: string;
  variables?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const inputCls =
  'w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-background text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40';

const LIMIT = 10;

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<EmailTemplate>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadTemplates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      const res = await fetch(`/api/admin/email-templates?${params}`);
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data.items);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (template: EmailTemplate) => {
    setEditingId(template.id);
    setEditData(template);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveTemplate = async () => {
    if (!editingId) return;
    setSaveLoading(true);
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editData.type,
          name: editData.name,
          subject: editData.subject,
          htmlContent: editData.htmlContent,
          textContent: editData.textContent,
          description: editData.description,
          variables: editData.variables,
          isActive: editData.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === editingId ? data.data : t))
        );
        setEditingId(null);
        setEditData({});
        alert('✅ 邮件模板已更新');
      } else {
        alert('❌ 更新失败: ' + data.error);
      }
    } catch (error) {
      alert('❌ 更新失败: ' + error);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">邮件模板配置</h1>
        <p className="text-text-secondary mt-1">管理系统邮件模板</p>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-text-muted">加载中...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-text-muted">暂无邮件模板</div>
        ) : templates.map((template) => (
          <div key={template.id} className="bg-card border border-card-border rounded-xl overflow-hidden">
            {editingId === template.id ? (
              // Edit Mode
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">模板名称</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">邮件主题</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={editData.subject || ''}
                      onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-text-muted mb-1">用途描述</label>
                  <textarea
                    className={inputCls + ' min-h-[60px]'}
                    value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-muted mb-1">HTML 邮件内容</label>
                  <textarea
                    className={inputCls + ' font-mono min-h-[200px]'}
                    value={editData.htmlContent || ''}
                    onChange={(e) => setEditData({ ...editData, htmlContent: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-muted mb-1">变量说明 (JSON)</label>
                  <textarea
                    className={inputCls + ' font-mono min-h-[80px]'}
                    value={editData.variables || ''}
                    onChange={(e) => setEditData({ ...editData, variables: e.target.value })}
                    placeholder='{"name": "收件人名称", "code": "验证码"}'
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={editData.isActive ?? true}
                    onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  启用此模板
                </label>

                <div className="flex gap-3">
                  <button
                    onClick={saveTemplate}
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
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">{template.name}</h3>
                    <p className="text-xs text-text-muted mt-1">
                      {template.type} • {template.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        template.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {template.isActive ? '✅ 启用' : '❌ 禁用'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded border border-border-primary mb-4">
                  <p className="text-xs text-text-muted mb-1">邮件主题:</p>
                  <p className="text-sm text-text-primary font-medium">{template.subject}</p>
                </div>

                {template.variables && (
                  <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded border border-blue-200 dark:border-blue-500/30 mb-4">
                    <p className="text-xs text-text-muted mb-1">支持的变量:</p>
                    <p className="text-xs text-text-primary font-mono">{template.variables}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(template)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#0d9488]/10 text-[#0d9488] text-sm rounded-lg hover:bg-[#0d9488]/20 transition-colors font-medium"
                  >
                    <Edit2 size={14} /> 编辑
                  </button>
                  <button
                    onClick={() => setPreviewId(previewId === template.id ? null : template.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-white/10 text-text-secondary text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <Eye size={14} /> {previewId === template.id ? '隐藏' : '预览'}
                  </button>
                </div>

                {previewId === template.id && (
                  <div className="mt-4 border border-border-primary rounded overflow-hidden">
                    <iframe
                      srcDoc={template.htmlContent}
                      className="w-full h-96"
                      title={`Preview of ${template.name}`}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={LIMIT}
          onChange={setPage}
        />
      </div>
    </div>
  );
}
