'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { ServiceCategoryDef } from '@/lib/types';
import Pagination from '@/components/Pagination';

const inputBase =
  'w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-background text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40';

const LIMIT = 10;

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategoryDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

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
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
        const res = await fetch(`/api/admin/service-categories?${params}`);
        const data = await res.json();
        if (data.success) {
          setCategories(data.data.items);
          setTotal(data.data.total);
          setTotalPages(data.data.totalPages);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [page]);

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
    setShowAddForm(false);
  };

  /* ── Add category ────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      alert('请填写分类名称和slug');
      return;
    }

    try {
      const res = await fetch('/api/admin/service-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        // Go to last page to see newly created item, or reload current page
        setPage(1);
        resetForm();
        alert('分类创建成功！');
      } else {
        alert(data.error ?? '创建失败');
      }
    } catch (err) {
      console.error('Failed to create category:', err);
      alert('创建失败');
    }
  };

  /* ── Toggle category active status ────────────────────── */
  const toggleCategory = async (cat: ServiceCategoryDef) => {
    try {
      const res = await fetch(`/api/admin/service-categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });

      const data = await res.json();
      if (data.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
        );
      } else {
        alert(data.error ?? '操作失败');
      }
    } catch (err) {
      console.error('Failed to toggle category:', err);
      alert('操作失败');
    }
  };

  /* ── Delete category ─────────────────────────────────── */
  const deleteCategory = async (id: string) => {
    if (!confirm('确认删除该分类？此操作不可恢复。')) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/service-categories/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        // If last item on page, go back a page
        if (categories.length === 1 && page > 1) setPage((p) => p - 1);
        else setPage((p) => p); // trigger reload via dependency
        setCategories((prev) => prev.filter((c) => c.id !== id));
        alert('分类已删除');
      } else {
        alert(data.error ?? '删除失败');
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert('删除失败');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">服务分类管理</h1>
          <p className="text-sm text-text-muted mt-1">管理平台上的服务分类，包括开通和关闭</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0a7c71] transition-colors font-medium text-sm"
        >
          <Plus size={18} /> 新增分类
        </button>
      </div>

      {/* Add Form */}
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

      {/* Categories List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#0d9488]" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#2d2d30] rounded-xl border border-border-primary">
            <p className="text-text-muted text-sm">暂无服务分类</p>
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white dark:bg-[#2d2d30] rounded-lg border border-border-primary p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-primary">{cat.name}</h3>
                <p className="text-xs text-text-muted mt-1">
                  {cat.nameEn && <span>{cat.nameEn} • </span>}
                  <span>slug: {cat.slug}</span>
                  {cat._count?.formFields ? <span> • {cat._count.formFields} 个字段</span> : null}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Status badge */}
                <button
                  onClick={() => toggleCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    cat.isActive
                      ? 'bg-[#0d9488]/10 text-[#0d9488] hover:bg-[#0d9488]/20'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-300'
                  }`}
                  title={cat.isActive ? '点击关闭' : '点击开通'}
                >
                  {cat.isActive ? '✓ 已开通' : '✗ 已关闭'}
                </button>

                {/* Delete button */}
                <button
                  onClick={() => deleteCategory(cat.id)}
                  disabled={deleting === cat.id}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="删除分类"
                >
                  {deleting === cat.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          ))
        )}

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
