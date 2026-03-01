'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Database, Loader2 } from 'lucide-react';
import { ServiceCategoryDef, FormFieldDef, FormFieldType, FormTemplateType, FORM_TEMPLATE_LABELS } from '@/lib/types';
import Pagination from '@/components/Pagination';

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

const FORM_TEMPLATES: { value: FormTemplateType; label: string }[] = [
  { value: 'USER_REGISTRATION',  label: '👤 用户注册表单' },
  { value: 'STANDARD_SERVICE',   label: '📋 标准服务表单' },
  { value: 'SIMPLE_CUSTOM',      label: '📝 简单定制服务表单' },
  { value: 'COMPLEX_CUSTOM',     label: '🏗️ 复杂定制服务表单' },
  { value: 'CONTRACT',           label: '📄 合同表单' },
];

const NEEDS_OPTIONS: FormFieldType[] = ['select', 'multiselect', 'chips', 'multichips'];

const inputCls =
  'w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-background text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40';

const FIELD_LIMIT = 20;

export default function FormBuilderPage() {
  const [categories, setCategories] = useState<ServiceCategoryDef[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplateType>('STANDARD_SERVICE');
  const [fields, setFields] = useState<FormFieldDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [expandedField, setExpandedField] = useState<string | null>(null);
  // Fields pagination
  const [fieldPage, setFieldPage] = useState(1);
  const [fieldTotalPages, setFieldTotalPages] = useState(1);
  const [fieldTotal, setFieldTotal] = useState(0);
  // Init services
  const [initSvc, setInitSvc] = useState(false);
  const [initSvcMsg, setInitSvcMsg] = useState<string | null>(null);

  // New field form state
  const [newField, setNewField] = useState({
    fieldType: 'text' as FormFieldType,
    fieldKey: '',
    label: '',
    placeholder: '',
    required: false,
    optionsRaw: '',
    displayOrder: 0,
  });

  /* ── Fetch categories ───────────────────────────────────────── */
  const loadCategories = useCallback(() => {
    fetch('/api/admin/service-categories?limit=100')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCategories(res.data.items ?? res.data);
      });
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  /* ── Init default services ──────────────────────────────────── */
  const handleInitServices = async () => {
    setInitSvc(true);
    setInitSvcMsg(null);
    try {
      const res  = await fetch('/api/admin/setup-services', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setInitSvcMsg(`✅ ${data.message}`);
        loadCategories();
      } else {
        setInitSvcMsg(`❌ ${data.error ?? '初始化失败'}`);
      }
    } catch {
      setInitSvcMsg('❌ 网络错误，请重试');
    } finally {
      setInitSvc(false);
    }
  };

  /* ── Fetch fields when category, template, or page changes ─────── */
  const loadFields = useCallback((catId: string, templateType: FormTemplateType, page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ templateType, page: String(page), limit: String(FIELD_LIMIT) });
    fetch(`/api/admin/service-categories/${catId}/fields?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setFields(res.data.items ?? res.data);
          setFieldTotal(res.data.total ?? 0);
          setFieldTotalPages(res.data.totalPages ?? 1);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Re-fetch when fieldPage changes
  useEffect(() => {
    if (selectedId) loadFields(selectedId, selectedTemplate, fieldPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldPage]);

  const selectCategory = (id: string) => {
    setSelectedId(id);
    setSelectedTemplate('STANDARD_SERVICE');
    setFields([]);
    setFieldPage(1);
    setShowAddField(false);
    setExpandedField(null);
    loadFields(id, 'STANDARD_SERVICE', 1);
  };

  const switchTemplate = (templateType: FormTemplateType) => {
    if (!selectedId) return;
    setSelectedTemplate(templateType);
    setFields([]);
    setFieldPage(1);
    setShowAddField(false);
    setExpandedField(null);
    loadFields(selectedId, templateType, 1);
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
        templateType: selectedTemplate,
        fieldType: newField.fieldType,
        fieldKey: newField.fieldKey,
        label: newField.label,
        placeholder: newField.placeholder || undefined,
        required: newField.required,
        options,
        displayOrder: fields.length,
      }),
    });
    const data = await res.json();
    if (data.success) {
      // Reload the last page to see the new field
      setNewField({ fieldType: 'text', fieldKey: '', label: '', placeholder: '', required: false, optionsRaw: '', displayOrder: 0 });
      setShowAddField(false);
      loadFields(selectedId, selectedTemplate, fieldPage);
    } else {
      alert('Error: ' + data.error);
    }
  };

  /* ── Delete field ───────────────────────────────────────────── */
  const deleteField = async (fieldId: string) => {
    if (!selectedId) return;
    const res = await fetch(`/api/admin/service-categories/${selectedId}/fields/${fieldId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      const newFields = fields.filter((f) => f.id !== fieldId);
      setFields(newFields);
      // If last item on page, go back a page
      if (newFields.length === 0 && fieldPage > 1) {
        setFieldPage((p) => p - 1);
      } else {
        loadFields(selectedId, selectedTemplate, fieldPage);
      }
    }
  };

  /* ── Toggle required ────────────────────────────────────────── */
  const toggleRequired = async (field: FormFieldDef) => {
    if (!selectedId) return;
    const res = await fetch(`/api/admin/service-categories/${selectedId}/fields/${field.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ required: !field.required }),
    });
    const data = await res.json();
    if (data.success) {
      setFields((prev) => prev.map((f) => (f.id === field.id ? { ...f, required: !f.required } : f)));
    }
  };

  const selectedCat = categories.find((c) => c.id === selectedId);

  return (
    <div className="space-y-4">
      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">表单构建器</h1>
        <button
          onClick={handleInitServices}
          disabled={initSvc}
          className="flex items-center gap-2 px-4 py-2 border border-[#0d9488] text-[#0d9488] rounded-lg text-sm hover:bg-[#0d9488]/10 transition-colors disabled:opacity-60"
        >
          {initSvc ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
          初始化默认服务
        </button>
      </div>

      {/* ── Init result banner ─────────────────────────────────── */}
      {initSvcMsg && (
        <div className={`px-4 py-3 rounded-xl text-sm flex items-start gap-2 ${
          initSvcMsg.startsWith('✅')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          <span className="flex-1">{initSvcMsg}</span>
          <button onClick={() => setInitSvcMsg(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

    <div className="flex gap-6">
      {/* ── Sidebar: Categories ────────────────────────────────── */}
      <aside className="w-48 flex-shrink-0 space-y-4">
        <h2 className="text-sm font-bold text-text-primary">服务分类</h2>
        <div className="space-y-1 max-h-[70vh] overflow-y-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedId === cat.id
                  ? 'bg-[#0d9488]/20 text-[#0d9488] font-medium border-l-2 border-[#0d9488]'
                  : 'text-text-secondary hover:bg-white/5'
              }`}
            >
              {cat.name}
              <span className="text-xs text-text-muted ml-2">({cat._count?.formFields || 0})</span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main: Template + Fields ────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {!selectedId ? (
          <div className="flex items-center justify-center h-64 text-text-muted text-sm">
            请先选择左侧服务分类
          </div>
        ) : (
          <>
            {/* ── Template type selector ─────────────────────── */}
            <div className="mb-6 space-y-3">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-3">选择表单类型</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {FORM_TEMPLATES.map((template) => (
                    <button
                      key={template.value}
                      onClick={() => switchTemplate(template.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        selectedTemplate === template.value
                          ? 'bg-[#0d9488] text-white shadow-md'
                          : 'bg-white dark:bg-[#2d2d30] text-text-secondary border border-border-primary hover:border-[#0d9488]'
                      }`}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Fields header ────────────────────────────── */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-text-primary">
                {selectedCat?.name} — {FORM_TEMPLATE_LABELS[selectedTemplate]}
              </h3>
              <button
                onClick={() => setShowAddField(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#0d9488] text-white text-sm rounded-lg hover:bg-[#0a7c71] transition-colors"
              >
                <Plus size={15} /> 添加字段
              </button>
            </div>

            {/* ── Fields list ────────────────────────────── */}
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
                    该表单类型暂无字段，点击「添加字段」开始配置
                  </p>
                )}

                {/* Fields pagination */}
                <Pagination
                  page={fieldPage}
                  totalPages={fieldTotalPages}
                  total={fieldTotal}
                  limit={FIELD_LIMIT}
                  onChange={setFieldPage}
                />
              </div>
            )}

            {/* ── Add field form ──────────────────────────── */}
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
                    <label className="block text-xs text-text-muted mb-1">字段 Key *</label>
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
                    <label className="block text-xs text-text-muted mb-1">占位文字</label>
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
                    className="w-4 h-4"
                  />
                  必填字段
                </label>

                <div className="flex gap-3">
                  <button
                    onClick={addField}
                    className="flex-1 px-4 py-2 bg-[#0d9488] text-white text-sm rounded-lg hover:bg-[#0a7c71] transition-colors font-medium"
                  >
                    保存字段
                  </button>
                  <button
                    onClick={() => setShowAddField(false)}
                    className="flex-1 px-4 py-2 bg-white dark:bg-[#1e1e1e] text-text-secondary border border-border-primary text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </div>
  );
}
