'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Edit2, Check, X } from 'lucide-react';
import DynamicFormRenderer from '@/components/DynamicFormRenderer';
import { ServiceCategoryDef, FormFieldDef, FormFieldType } from '@/lib/types';

const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: 'text',        label: '单行文字' },
  { value: 'textarea',    label: '多行文字' },
  { value: 'number',      label: '数字' },
  { value: 'select',      label: '下拉选择（单选）' },
  { value: 'multiselect', label: '多选列表' },
  { value: 'chips',       label: '标签单选' },
  { value: 'multichips',  label: '标签多选' },
  { value: 'date',        label: '日期' },
];

const NEEDS_OPTIONS: FormFieldType[] = ['select', 'multiselect', 'chips', 'multichips'];

const inputCls =
  'w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-background text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40';

export default function FormBuilderPage() {
  const [categories, setCategories]   = useState<ServiceCategoryDef[]>([]);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [fields, setFields]           = useState<FormFieldDef[]>([]);
  const [preview, setPreview]         = useState<Record<string, unknown>>({});
  const [loading, setLoading]         = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [expandedField, setExpandedField] = useState<string | null>(null);

  // New field form state
  const [newField, setNewField] = useState({
    fieldType: 'text' as FormFieldType,
    fieldKey: '',
    label: '',
    placeholder: '',
    required: false,
    optionsRaw: '',   // comma-separated
    displayOrder: 0,
  });

  /* ── Fetch categories ───────────────────────────────────────── */
  useEffect(() => {
    fetch('/api/admin/service-categories')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCategories(res.data);
      });
  }, []);

  /* ── Fetch fields when category changes ─────────────────────── */
  const loadFields = useCallback((catId: string) => {
    setLoading(true);
    fetch(`/api/admin/service-categories/${catId}/fields`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setFields(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectCategory = (id: string) => {
    setSelectedId(id);
    setFields([]);
    setPreview({});
    setShowAddField(false);
    setExpandedField(null);
    loadFields(id);
  };

  /* ── Add field ──────────────────────────────────────────────── */
  const addField = async () => {
    if (!selectedId || !newField.fieldKey || !newField.label) return;

    const options = NEEDS_OPTIONS.includes(newField.fieldType)
      ? newField.optionsRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const res = await fetch(`/api/admin/service-categories/${selectedId}/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldType:    newField.fieldType,
        fieldKey:     newField.fieldKey,
        label:        newField.label,
        placeholder:  newField.placeholder || undefined,
        required:     newField.required,
        options,
        displayOrder: fields.length,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setFields((prev) => [...prev, data.data]);
      setNewField({ fieldType: 'text', fieldKey: '', label: '', placeholder: '', required: false, optionsRaw: '', displayOrder: 0 });
      setShowAddField(false);
    } else {
      alert(data.error ?? '添加失败');
    }
  };

  /* ── Delete field ───────────────────────────────────────────── */
  const deleteField = async (fieldId: string) => {
    if (!confirm('确认删除该字段？')) return;
    const res = await fetch(`/api/admin/fields/${fieldId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) setFields((prev) => prev.filter((f) => f.id !== fieldId));
  };

  /* ── Toggle required ────────────────────────────────────────── */
  const toggleRequired = async (field: FormFieldDef) => {
    const res = await fetch(`/api/admin/fields/${field.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ required: !field.required }),
    });
    const data = await res.json();
    if (data.success) setFields((prev) => prev.map((f) => f.id === field.id ? data.data : f));
  };

  const selectedCat = categories.find((c) => c.id === selectedId);

  return (
    <div className="flex h-full gap-6">

      {/* ── Left: Category list ─────────────────────────────── */}
      <aside className="w-64 flex-shrink-0">
        <h2 className="text-base font-bold text-text-primary mb-3">服务分类</h2>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors ${
                selectedId === cat.id
                  ? 'bg-[#0d9488] text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-white/5 text-text-primary'
              }`}
            >
              <span>{cat.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                selectedId === cat.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-text-muted'
              }`}>
                {cat._count?.formFields ?? 0}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Middle: Field list + editor ─────────────────────── */}
      <div className="flex-1 min-w-0">
        {!selectedId ? (
          <div className="flex items-center justify-center h-64 text-text-muted text-sm">
            请先选择左侧服务分类
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-text-primary">
                {selectedCat?.name} — 表单字段
              </h2>
              <button
                onClick={() => setShowAddField(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#0d9488] text-white text-sm rounded-lg hover:bg-[#0a7c71] transition-colors"
              >
                <Plus size={15} /> 添加字段
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-text-muted">加载中…</p>
            ) : (
              <div className="space-y-2">
                {fields.map((f) => (
                  <div key={f.id} className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm border border-border-primary">
                    {/* Field header */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <GripVertical size={16} className="text-text-muted flex-shrink-0 cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{f.label}</p>
                        <p className="text-xs text-text-muted">{f.fieldKey} · {f.fieldType}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Required toggle */}
                        <button
                          onClick={() => toggleRequired(f)}
                          className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                            f.required
                              ? 'border-red-400 text-red-400 bg-red-400/10'
                              : 'border-border-primary text-text-muted'
                          }`}
                        >
                          {f.required ? '必填' : '选填'}
                        </button>
                        {/* Expand */}
                        <button
                          onClick={() => setExpandedField(expandedField === f.id ? null : f.id)}
                          className="text-text-muted hover:text-text-primary"
                        >
                          {expandedField === f.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => deleteField(f.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    {/* Expanded detail */}
                    {expandedField === f.id && (
                      <div className="border-t border-border-primary px-4 py-3 text-xs text-text-muted space-y-1">
                        {f.placeholder && <p>占位文字：{f.placeholder}</p>}
                        {f.options && f.options.length > 0 && (
                          <p>选项：{f.options.join(' / ')}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {fields.length === 0 && !showAddField && (
                  <p className="text-sm text-text-muted text-center py-8">
                    该分类暂无字段，点击「添加字段」开始配置
                  </p>
                )}
              </div>
            )}

            {/* Add field form */}
            {showAddField && (
              <div className="mt-4 bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm border border-[#0d9488]/40 p-5 space-y-4">
                <p className="font-semibold text-sm text-text-primary">新增字段</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">字段类型 *</label>
                    <select
                      value={newField.fieldType}
                      onChange={(e) => setNewField((p) => ({ ...p, fieldType: e.target.value as FormFieldType }))}
                      className={inputCls}
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">字段 Key（英文小写+下划线）*</label>
                    <input
                      className={inputCls}
                      placeholder="e.g. room_count"
                      value={newField.fieldKey}
                      onChange={(e) => setNewField((p) => ({ ...p, fieldKey: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">显示标签 *</label>
                    <input
                      className={inputCls}
                      placeholder="e.g. 房间数量"
                      value={newField.label}
                      onChange={(e) => setNewField((p) => ({ ...p, label: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">占位文字（可选）</label>
                    <input
                      className={inputCls}
                      placeholder="e.g. 请输入..."
                      value={newField.placeholder}
                      onChange={(e) => setNewField((p) => ({ ...p, placeholder: e.target.value }))}
                    />
                  </div>
                </div>

                {NEEDS_OPTIONS.includes(newField.fieldType) && (
                  <div>
                    <label className="block text-xs text-text-muted mb-1">选项（逗号分隔）*</label>
                    <input
                      className={inputCls}
                      placeholder="e.g. 1室,2室,3室,4室+"
                      value={newField.optionsRaw}
                      onChange={(e) => setNewField((p) => ({ ...p, optionsRaw: e.target.value }))}
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={(e) => setNewField((p) => ({ ...p, required: e.target.checked }))}
                    className="w-4 h-4 rounded accent-[#0d9488]"
                  />
                  必填项
                </label>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={addField}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0d9488] text-white text-sm rounded-lg hover:bg-[#0a7c71]"
                  >
                    <Check size={14} /> 保存字段
                  </button>
                  <button
                    onClick={() => setShowAddField(false)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-border-primary text-text-secondary text-sm rounded-lg hover:bg-gray-50"
                  >
                    <X size={14} /> 取消
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Right: Live preview ──────────────────────────────── */}
      <div className="w-72 flex-shrink-0">
        <h2 className="text-base font-bold text-text-primary mb-3">表单预览</h2>
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm border border-border-primary p-4">
          {fields.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-6">添加字段后此处预览</p>
          ) : (
            <DynamicFormRenderer
              fields={fields}
              values={preview}
              onChange={(key, val) => setPreview((p) => ({ ...p, [key]: val }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
