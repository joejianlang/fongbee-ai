'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import DynamicFormRenderer from '@/components/DynamicFormRenderer';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { ServiceCategoryDef, FormTemplateDef } from '@/lib/types';

// ─── Shared form fields shown for every category (budget, timeline, address) ──

const BUDGET_OPTIONS = ['< $100', '$100–$300', '$300–$800', '$800–$2000', '> $2000'];
const TIMELINE_OPTIONS = ['今天', '本周内', '两周内', '本月内', '时间灵活'];

// ─── Step 1: Category Picker ──────────────────────────────────────────────────

interface CategoryPickerProps {
  categories: ServiceCategoryDef[];
  loading: boolean;
  onSelect: (cat: ServiceCategoryDef) => void;
}

function CategoryPicker({ categories, loading, onSelect }: CategoryPickerProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin text-[#0d9488]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {categories.map((cat) => {
        const Icon = getCategoryIcon(cat.icon);
        const bg = cat.color ? `${cat.color}18` : '#0d948818';
        const fg = cat.color ?? '#0d9488';
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-transparent bg-white dark:bg-[#2d2d30] shadow-sm hover:border-[#0d9488]/50 hover:shadow-md transition-all text-center group"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: bg, color: fg }}
            >
              <Icon size={22} />
            </div>
            <p className="text-sm font-semibold text-text-primary dark:text-white leading-tight">{cat.name}</p>
            <p className="text-xs text-text-muted leading-tight line-clamp-2">{cat.description ?? cat.nameEn}</p>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomRequestPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [categories, setCategories] = useState<ServiceCategoryDef[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  const [selectedCat, setSelectedCat]       = useState<ServiceCategoryDef | null>(null);
  const [template, setTemplate]             = useState<FormTemplateDef | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);

  // Dynamic field values
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});

  // Shared fields
  const [budget,   setBudget]   = useState('');
  const [timeline, setTimeline] = useState('');
  const [address,  setAddress]  = useState('');
  const [contact,  setContact]  = useState('');
  const [images,   setImages]   = useState<string[]>([]);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  /* ── Fetch all categories ─────────────────────────────────────── */
  useEffect(() => {
    fetch('/api/admin/service-categories')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCategories(res.data.filter((c: ServiceCategoryDef) => c.isActive));
      })
      .finally(() => setCatLoading(false));
  }, []);

  /* ── When user picks a category, fetch its template ─────────── */
  const selectCategory = async (cat: ServiceCategoryDef) => {
    setSelectedCat(cat);
    setFieldValues({});
    setTemplateLoading(true);
    setStep(2);

    try {
      const res = await fetch(`/api/form-templates/${cat.id}`);
      const data = await res.json();
      if (data.success) setTemplate(data.data);
    } finally {
      setTemplateLoading(false);
    }
  };

  /* ── Validate required fields ────────────────────────────────── */
  const requiredFieldsFilled = () => {
    if (!template) return false;
    return template.fields
      .filter((f) => f.required)
      .every((f) => {
        const val = fieldValues[f.fieldKey];
        if (Array.isArray(val)) return val.length > 0;
        return val !== undefined && val !== '';
      });
  };

  const canSubmit = requiredFieldsFilled() && address.trim();

  /* ── Submit ──────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!canSubmit || submitting || !selectedCat) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900)); // simulate API call
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => router.push('/services'), 1500);
  };

  /* ── Success screen ──────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#0d9488]/10 flex items-center justify-center mb-4">
          <span className="text-3xl">🎉</span>
        </div>
        <h2 className="text-lg font-bold text-text-primary dark:text-white mb-1">需求发布成功！</h2>
        <p className="text-sm text-text-muted">我们将为您匹配合适的服务商，请留意通知…</p>
      </div>
    );
  }

  const inputBase =
    'w-full px-3 py-2.5 text-sm border border-border-primary rounded-lg bg-background text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40';

  return (
    <div className="pb-32 md:pb-10">

      {/* ── Top Nav ────────────────────────────────────────────── */}
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center justify-between">
        {step === 1 ? (
          <Link
            href="/services"
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors"
          >
            <ArrowLeft size={18} /> 返回
          </Link>
        ) : (
          <button
            onClick={() => { setStep(1); setSelectedCat(null); setTemplate(null); }}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors"
          >
            <ArrowLeft size={18} /> 重选分类
          </button>
        )}
        <span className="font-semibold text-text-primary dark:text-white text-sm">
          {step === 1 ? '发布定制需求' : `填写${selectedCat?.name ?? ''}需求`}
        </span>
        {step === 2 ? (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all ${
              canSubmit && !submitting
                ? 'bg-[#0d9488] text-white hover:bg-[#0a7c71]'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? '提交中…' : '提交'}
          </button>
        ) : (
          <span />
        )}
      </div>

      <div className="px-4 md:px-0 mt-4 space-y-4">

        {/* ── Step indicator ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className={`font-semibold ${step === 1 ? 'text-[#0d9488]' : ''}`}>①选择分类</span>
          <div className="flex-1 h-px bg-border-primary" />
          <span className={`font-semibold ${step === 2 ? 'text-[#0d9488]' : ''}`}>②填写需求</span>
        </div>

        {/* ─────── STEP 1: Category picker ──────────────────────── */}
        {step === 1 && (
          <CategoryPicker
            categories={categories}
            loading={catLoading}
            onSelect={selectCategory}
          />
        )}

        {/* ─────── STEP 2: Dynamic form ─────────────────────────── */}
        {step === 2 && (
          <>
            {/* Category-specific fields from backend */}
            <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
              <p className="text-xs font-semibold text-text-muted mb-3">
                {selectedCat?.name} 需求详情
              </p>
              {templateLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={22} className="animate-spin text-[#0d9488]" />
                </div>
              ) : (
                <DynamicFormRenderer
                  fields={template?.fields ?? []}
                  values={fieldValues}
                  onChange={(key, val) => setFieldValues((prev) => ({ ...prev, [key]: val }))}
                />
              )}
            </div>

            {/* Shared: Budget */}
            <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
              <p className="text-xs font-semibold text-text-muted mb-2">预算范围（选填）</p>
              <div className="flex flex-wrap gap-2">
                {BUDGET_OPTIONS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBudget(budget === b ? '' : b)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      budget === b
                        ? 'bg-[#0d9488] text-white border-[#0d9488]'
                        : 'border-border-primary text-text-secondary hover:border-[#0d9488] hover:text-[#0d9488]'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Shared: Timeline */}
            <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
              <p className="text-xs font-semibold text-text-muted mb-2">期望时间（选填）</p>
              <div className="flex flex-wrap gap-2">
                {TIMELINE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeline(timeline === t ? '' : t)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      timeline === t
                        ? 'bg-[#0d9488] text-white border-[#0d9488]'
                        : 'border-border-primary text-text-secondary hover:border-[#0d9488] hover:text-[#0d9488]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Shared: Address */}
            <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
              <p className="text-xs font-semibold text-text-muted mb-2">
                服务地址 <span className="text-red-400">*</span>
              </p>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="如：123 Gordon St, Guelph, ON"
                className={inputBase}
              />
            </div>

            {/* Shared: Contact */}
            <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
              <p className="text-xs font-semibold text-text-muted mb-2">联系方式（选填）</p>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="手机号或微信号"
                className={inputBase}
              />
            </div>

            {/* Shared: Images */}
            <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
              <p className="text-xs font-semibold text-text-muted mb-3">参考图片（最多 6 张，选填）</p>
              <div className="flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {images.length < 6 && (
                  <button
                    onClick={() => setImages((prev) => [
                      ...prev,
                      `https://images.unsplash.com/photo-150094214${prev.length}?w=160&h=160&fit=crop`,
                    ])}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-border-primary flex flex-col items-center justify-center gap-1 text-text-muted hover:border-[#0d9488] hover:text-[#0d9488] transition-colors text-xs"
                  >
                    <span className="text-xl leading-none">+</span>
                    添加
                  </button>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
              <p className="font-semibold mb-1.5">📋 提示</p>
              <p>• 填写越详细，匹配到合适服务商的速度越快</p>
              <p>• 提交后服务商将在 24 小时内与您联系报价</p>
              <p>• 您可以在「我的需求」中查看进展</p>
            </div>
          </>
        )}
      </div>

      {/* ── Mobile bottom button (Step 2 only) ─────────────────── */}
      {step === 2 && (
        <div className="fixed bottom-16 md:hidden left-0 right-0 bg-white dark:bg-[#2d2d30] border-t border-border-primary px-4 py-3 z-40">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
              canSubmit && !submitting
                ? 'bg-[#0d9488] text-white hover:bg-[#0a7c71]'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <><Loader2 size={15} className="animate-spin" /> 提交中…</>
            ) : canSubmit ? (
              <><Send size={15} /> 提交需求</>
            ) : (
              '请填写必填项和地址'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
