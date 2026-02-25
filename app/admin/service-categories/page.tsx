'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Toggle2, Trash2, Loader2 } from 'lucide-react';
import { ServiceCategoryDef } from '@/lib/types';

const inputBase =
  'w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-background text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40';

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategoryDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    slug: '',
    description: '',
    icon: '',
    color: '#0d9488',
    displayOrder: 0,
  });

  /* ── Fetch categories ────────────────────────────────── */
  useEffect(() => {
    fetch('/api/admin/service-categories')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCategories(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* ── Reset form ──────────────────────────────────────── */
  const resetForm = () => {
    setFormData({
      name: '',
      nameEn: '',
      slug: '',
      description: '',
      icon: '',
      color: '#0d9488',
      displayOrder: 0,
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  /* ── Add/Update category ─────────────────────────────── */
  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      alert('请填写分类名称和slug');
      return;
    }

    const res = await fetch('/api/admin/service-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (data.success) {
      setCategories((prev) => [...prev, data.data]);
      resetForm();
      alert('分类创建成功！');
    } else {
      alert(data.error ?? '创建失败');
    }
  };

  /* ── Toggle active status ────────────────────────────── */
  const toggleActive = async (cat: ServiceCategoryDef) => {
    // Note: API doesn't have update endpoint yet, so we'll simulate
    setCategories((prev) =>
      prev.map((c) =>
        c.id === cat.id ? { ...c, isActive: !c.isActive } : c
      )
    );
    // In real app, would call PATCH endpoint
  };

  /* ── Delete category ─────────────────────────────────── */
  const deleteCategory = async (id: string) => {
    if (!confirm('确认删除该分类？此操作不可恢复。')) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    // In real app, would call DELETE endpoint
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin text-[#0d9488]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">服务分类管理</h1>
          <p className="text-sm text-text-muted mt-1">管理平台上的服务分类，控制分类的开通和关闭</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0a7c71] transition-colors"
        >
          <Plus size={18} /> 新增分类
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm border border-border-primary p-6 space-y-4">
          <h2 className="font-semibold text-text-primary">创建新分类</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                分类名称 (中文) *
              </label>
              <input
                type="text"
                placeholder="如：家庭清洁"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className={inputBase}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                分类名称 (英文)
              </label>
              <input
                type="text"
                placeholder="如：Home Cleaning"
                value={formData.nameEn}
                onChange={(e) => setFormData((p) => ({ ...p, nameEn: e.target.value }))}
                className={inputBase}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                Slug (URL) *
              </label>
              <input
                type="text"
                placeholder="如：cleaning"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                  }))
                }
                className={inputBase}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                显示顺序
              </label>
              <input
                type="number"
                min="0"
                value={formData.displayOrder}
                onChange={(e) => setFormData((p) => ({ ...p, displayOrder: parseInt(e.target.value) }))}
                className={inputBase}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">
              描述
            </label>
            <textarea
              rows={3}
              placeholder="分类描述..."
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              className={`${inputBase} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                图标名称 (Lucide)
              </label>
              <input
                type="text"
                placeholder="如：home, truck, leaf"
                value={formData.icon}
                onChange={(e) => setFormData((p) => ({ ...p, icon: e.target.value }))}
                className={inputBase}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                颜色
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
                  className="w-12 h-10 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
                  className={`${inputBase} flex-1`}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0a7c71] transition-colors text-sm font-medium"
            >
              保存分类
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-border-primary text-text-secondary rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm font-medium"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`rounded-xl shadow-sm border transition-all ${
              cat.isActive
                ? 'border-border-primary bg-white dark:bg-[#2d2d30]'
                : 'border-red-200 bg-red-50 dark:bg-red-950/20'
            }`}
          >
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-text-primary">{cat.name}</h3>
                  <p className="text-xs text-text-muted">{cat.nameEn}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{
                    backgroundColor: cat.color ? `${cat.color}20` : '#0d948820',
                    color: cat.color ?? '#0d9488',
                  }}
                >
                  {cat.icon ? cat.icon.charAt(0) : '📦'}
                </div>
              </div>

              {/* Info */}
              <div className="text-xs space-y-1 text-text-muted">
                <p>Slug: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{cat.slug}</code></p>
                <p>字段数: <span className="font-semibold text-text-primary">{cat._count?.formFields ?? 0}</span></p>
                <p>排序: {cat.displayOrder}</p>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    cat.isActive
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}
                >
                  {cat.isActive ? '✓ 已开通' : '✗ 已关闭'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-border-primary">
                <button
                  onClick={() => toggleActive(cat)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-border-primary text-text-secondary hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  title={cat.isActive ? '关闭分类' : '开通分类'}
                >
                  <Toggle2 size={14} />
                  {cat.isActive ? '关闭' : '开通'}
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 size={14} />
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && !showAddForm && (
        <div className="text-center py-12 text-text-muted">
          <p className="text-sm">暂无服务分类，点击「新增分类」开始创建</p>
        </div>
      )}
    </div>
  );
}
