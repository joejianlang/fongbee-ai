'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Phone, Lock, User, AlertCircle, ChevronLeft, Check, ChevronRight } from 'lucide-react';

interface ServiceCategory {
  id: string;
  name: string;
  nameEn: string | null;
  icon: string | null;
  color: string | null;
  slug: string;
  description: string | null;
}

interface FormField {
  id: string;
  fieldKey: string;
  fieldType: string;
  label: string;
  placeholder: string | null;
  required: boolean;
  optionsJson: unknown;
  displayOrder: number;
}

// ── Dynamic field renderer ────────────────────────────────────────────────────
function DynamicField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: unknown;
  onChange: (key: string, val: unknown) => void;
}) {
  const inputClass =
    'w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all';

  const options: string[] = Array.isArray(field.optionsJson)
    ? (field.optionsJson as string[])
    : [];

  const label = (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  switch (field.fieldType) {
    case 'textarea':
      return (
        <div>
          {label}
          <textarea
            value={(value as string) ?? ''}
            onChange={(e) => onChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder ?? ''}
            required={field.required}
            rows={3}
            className={inputClass + ' resize-none'}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          {label}
          <select
            value={(value as string) ?? ''}
            onChange={(e) => onChange(field.fieldKey, e.target.value)}
            required={field.required}
            className={inputClass}
          >
            <option value="">{field.placeholder ?? '请选择'}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );

    case 'multiselect':
      return (
        <div>
          {label}
          <div className="space-y-2">
            {options.map((opt) => {
              const selected = Array.isArray(value) ? (value as string[]).includes(opt) : false;
              return (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const prev = Array.isArray(value) ? (value as string[]) : [];
                      onChange(
                        field.fieldKey,
                        selected ? prev.filter((v) => v !== opt) : [...prev, opt]
                      );
                    }}
                    className="w-4 h-4 text-[#0d9488] rounded"
                  />
                  <span className="text-sm text-gray-700">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      );

    case 'chips':
      return (
        <div>
          {label}
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const selected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange(field.fieldKey, opt)}
                  className={`px-4 py-2 text-sm rounded-full border transition-all ${
                    selected
                      ? 'bg-[#0d9488] text-white border-[#0d9488]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#0d9488]'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      );

    case 'multichips':
      return (
        <div>
          {label}
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const selected = Array.isArray(value) ? (value as string[]).includes(opt) : false;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    const prev = Array.isArray(value) ? (value as string[]) : [];
                    onChange(
                      field.fieldKey,
                      selected ? prev.filter((v) => v !== opt) : [...prev, opt]
                    );
                  }}
                  className={`px-4 py-2 text-sm rounded-full border transition-all ${
                    selected
                      ? 'bg-[#0d9488] text-white border-[#0d9488]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#0d9488]'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      );

    case 'number':
      return (
        <div>
          {label}
          <input
            type="number"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder ?? ''}
            required={field.required}
            className={inputClass}
          />
        </div>
      );

    case 'date':
      return (
        <div>
          {label}
          <input
            type="date"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(field.fieldKey, e.target.value)}
            required={field.required}
            className={inputClass}
          />
        </div>
      );

    default:
      return (
        <div>
          {label}
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder ?? ''}
            required={field.required}
            className={inputClass}
          />
        </div>
      );
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────
const FIELDS_PER_PAGE = 4;

export default function ServiceProviderRegisterPage() {
  const [step, setStep] = useState<'category' | 'form'>('category');

  // Category selection
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);

  // Dynamic fields
  const [dynamicFields, setDynamicFields] = useState<FormField[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [dynamicValues, setDynamicValues] = useState<Record<string, unknown>>({});

  // Form pagination (within step 2)
  // formPage 0 = basic info; 1..N = dynamic field groups
  const [formPage, setFormPage] = useState(0);

  // Basic fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Submit state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const inputClass =
    'w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all';

  // ── Derived: split dynamic fields into pages ─────────────────────────────
  const dynamicPages: FormField[][] = [];
  for (let i = 0; i < dynamicFields.length; i += FIELDS_PER_PAGE) {
    dynamicPages.push(dynamicFields.slice(i, i + FIELDS_PER_PAGE));
  }
  const totalFormPages = 1 + dynamicPages.length; // page 0 (base) + N dynamic pages
  const isLastFormPage = formPage === totalFormPages - 1;
  const currentDynamicFields: FormField[] = dynamicPages[formPage - 1] ?? [];

  // ── Load categories ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/service-categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
      })
      .catch(console.error)
      .finally(() => setCategoryLoading(false));
  }, []);

  // ── Load dynamic fields when category is selected ────────────────────────
  useEffect(() => {
    if (!selectedCategory) return;
    setFieldsLoading(true);
    setDynamicValues({});
    setFormPage(0); // reset to base page when category changes
    fetch(
      `/api/admin/service-categories/${selectedCategory.id}/fields?templateType=USER_REGISTRATION&limit=100`
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const sorted = [...(d.data?.items ?? [])].sort(
            (a: FormField, b: FormField) => a.displayOrder - b.displayOrder
          );
          setDynamicFields(sorted);
        }
      })
      .catch(console.error)
      .finally(() => setFieldsLoading(false));
  }, [selectedCategory]);

  const handleDynamicChange = (key: string, val: unknown) => {
    setDynamicValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSelectCategory = (cat: ServiceCategory) => {
    setSelectedCategory(cat);
  };

  const handleNextStep = () => {
    if (!selectedCategory) return;
    setError('');
    setFormPage(0);
    setStep('form');
  };

  // ── Per-page validation + advance ────────────────────────────────────────
  const handleFormNext = () => {
    setError('');

    if (formPage === 0) {
      // Validate basic fields
      if (!name || !email || !phone || !password || !confirmPassword) {
        setError('请填写所有必填项');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
      if (password.length < 8) {
        setError('密码长度至少8个字符');
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setError('密码必须包含至少一个大写字母');
        return;
      }
      if (!/\d/.test(password)) {
        setError('密码必须包含至少一个数字');
        return;
      }
    } else {
      // Validate required dynamic fields on current page
      const missing = currentDynamicFields.filter((f) => {
        if (!f.required) return false;
        const val = dynamicValues[f.fieldKey];
        if (val === undefined || val === null || val === '') return true;
        if (Array.isArray(val) && val.length === 0) return true;
        return false;
      });
      if (missing.length > 0) {
        setError(`请填写必填项：${missing.map((f) => f.label).join('、')}`);
        return;
      }
    }

    setFormPage((p) => p + 1);
  };

  // ── Submit (only called on the last page) ────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // If not last page, treat enter-key as "next page"
    if (!isLastFormPage) {
      handleFormNext();
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Final required-field check for last dynamic page
      if (formPage > 0) {
        const missing = currentDynamicFields.filter((f) => {
          if (!f.required) return false;
          const val = dynamicValues[f.fieldKey];
          if (val === undefined || val === null || val === '') return true;
          if (Array.isArray(val) && val.length === 0) return true;
          return false;
        });
        if (missing.length > 0) {
          setError(`请填写必填项：${missing.map((f) => f.label).join('、')}`);
          return;
        }
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          role: 'SERVICE_PROVIDER',
          categoryId: selectedCategory?.id,
          registrationData: dynamicValues,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || data.error || '注册失败');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/auth/login/service-provider';
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#0d9488] flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">注册成功！</h1>
          <p className="text-gray-600 mb-6">
            恭喜！您已成功注册为服务商。
            <br />
            <br />
            正在跳转到登录页面...
          </p>
          <div className="inline-block w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0d9488] to-[#0a7c71] flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-black text-2xl">优</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">服务商注册</h1>
          <p className="text-gray-600 text-sm mt-1">与优服佳合作，拓展您的客户</p>
        </div>

        {/* Top step indicator (category → form) */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0d9488] text-white flex items-center justify-center text-sm font-bold">
              {step === 'form' ? <Check size={16} /> : '1'}
            </div>
            <span className={`text-sm font-medium ${step === 'category' ? 'text-gray-800' : 'text-gray-500'}`}>
              选择服务分类
            </span>
          </div>
          <div className="w-8 h-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === 'form' ? 'bg-[#0d9488] text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              2
            </div>
            <span className={`text-sm font-medium ${step === 'form' ? 'text-gray-800' : 'text-gray-400'}`}>
              填写注册信息
            </span>
          </div>
        </div>

        {/* ── STEP 1: Category selection ──────────────────────────────────── */}
        {step === 'category' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">选择您的服务分类</h2>
            <p className="text-sm text-gray-500 mb-5">请选择您主要提供的服务类型（单选）</p>

            {categoryLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <p className="text-center text-gray-500 py-8">暂无可用服务分类</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const isSelected = selectedCategory?.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                        isSelected
                          ? 'border-[#0d9488] bg-[#0d9488]/5 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#0d9488] flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mb-2 text-xl"
                        style={{ backgroundColor: cat.color ? `${cat.color}20` : '#0d948820' }}
                      >
                        {cat.icon ?? '🔧'}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{cat.name}</p>
                      {cat.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{cat.description}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={handleNextStep}
              disabled={!selectedCategory}
              className="w-full mt-6 py-3 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0a7c71] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              下一步：填写注册信息
            </button>

            <p className="text-sm text-gray-600 text-center mt-4">
              已有账户？{' '}
              <Link href="/auth/login/service-provider" className="text-[#0d9488] hover:text-[#0a7c71] font-semibold">
                直接登录
              </Link>
            </p>
          </div>
        )}

        {/* ── STEP 2: Registration form (paginated) ────────────────────────── */}
        {step === 'form' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">

            {/* Header: selected category badge + back / sub-page progress */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                  style={{
                    backgroundColor: selectedCategory?.color
                      ? `${selectedCategory.color}20`
                      : '#0d948820',
                  }}
                >
                  {selectedCategory?.icon ?? '🔧'}
                </div>
                <div>
                  <p className="text-xs text-gray-500">已选分类</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedCategory?.name}</p>
                </div>
              </div>

              {/* Back: "上一步" within form, or "重新选择" back to category */}
              {formPage > 0 ? (
                <button
                  type="button"
                  onClick={() => { setError(''); setFormPage((p) => p - 1); }}
                  className="flex items-center gap-1 text-sm text-[#0d9488] hover:text-[#0a7c71] font-medium"
                >
                  <ChevronLeft size={16} />
                  上一步
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setStep('category'); setFormPage(0); }}
                  className="flex items-center gap-1 text-sm text-[#0d9488] hover:text-[#0a7c71] font-medium"
                >
                  <ChevronLeft size={16} />
                  重新选择
                </button>
              )}
            </div>

            {/* Sub-page progress dots (only shown when there are multiple form pages) */}
            {totalFormPages > 1 && (
              <div className="flex items-center justify-center gap-2 mb-5">
                <span className="text-xs text-gray-400">
                  第 {formPage + 1} / {totalFormPages} 步
                </span>
                <div className="flex gap-1.5">
                  {Array.from({ length: totalFormPages }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all ${
                        i < formPage
                          ? 'w-2 h-2 bg-[#0d9488]'
                          : i === formPage
                          ? 'w-4 h-2 bg-[#0d9488]'
                          : 'w-2 h-2 bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">

              {/* ── Page 0: Basic fields ── */}
              {formPage === 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      您的名字 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="输入您的真实名字"
                        className={inputClass + ' pl-10'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      邮箱地址 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className={inputClass + ' pl-10'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      手机号 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1-416-555-0000"
                        className={inputClass + ' pl-10'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      密码 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="至少8个字符，包含大写字母和数字"
                        className={inputClass + ' pl-10 pr-10'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">密码需至少8个字符，包含大写字母和数字</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      确认密码 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="再次输入密码"
                        className={inputClass + ' pl-10 pr-10'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── Pages 1..N: Dynamic fields (current batch) ── */}
              {formPage > 0 && (
                <>
                  {fieldsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                          <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Section label */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                          {selectedCategory?.name} 专属信息
                        </span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                      {currentDynamicFields.map((field) => (
                        <DynamicField
                          key={field.id}
                          field={field}
                          value={dynamicValues[field.fieldKey]}
                          onChange={handleDynamicChange}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Action button ── */}
              {isLastFormPage ? (
                // Last page: submit
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0a7c71] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      注册中...
                    </span>
                  ) : (
                    '提交注册'
                  )}
                </button>
              ) : (
                // Not last page: next
                <button
                  type="button"
                  onClick={handleFormNext}
                  className="w-full py-3 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0a7c71] transition-all shadow-md mt-2 flex items-center justify-center gap-2"
                >
                  下一步
                  <ChevronRight size={18} />
                </button>
              )}
            </form>

            <p className="text-sm text-gray-600 text-center mt-4">
              已有账户？{' '}
              <Link href="/auth/login/service-provider" className="text-[#0d9488] hover:text-[#0a7c71] font-semibold">
                直接登录
              </Link>
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-6 px-2">
          继续表示您同意{' '}
          <Link href="/terms" className="text-[#0d9488] hover:underline">
            服务条款
          </Link>
          {' '}和{' '}
          <Link href="/privacy" className="text-[#0d9488] hover:underline">
            隐私政策
          </Link>
        </p>
      </div>
    </div>
  );
}
