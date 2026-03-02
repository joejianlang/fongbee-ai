'use client';

import { FormFieldDef } from '@/lib/types';
import AddressAutocomplete from '@/components/AddressAutocomplete';

interface DynamicFormRendererProps {
  fields: FormFieldDef[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  disabled?: boolean;
}

const inputBase =
  'w-full px-3 py-2.5 text-sm border border-border-primary rounded-lg bg-background text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40 transition-all';

export default function DynamicFormRenderer({
  fields,
  values,
  onChange,
  disabled = false,
}: DynamicFormRendererProps) {
  if (fields.length === 0) {
    return (
      <p className="text-sm text-text-muted text-center py-6">该分类暂无自定义字段</p>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const value = values[field.fieldKey];
        const label = (
          <label className="block text-xs font-semibold text-text-muted mb-1.5">
            {field.label}
            {field.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        );

        switch (field.fieldType) {
          // ── text / number ─────────────────────────────────
          case 'text':
          case 'number':
            return (
              <div key={field.id}>
                {label}
                <input
                  type={field.fieldType}
                  disabled={disabled}
                  placeholder={field.placeholder ?? ''}
                  value={(value as string) ?? ''}
                  onChange={(e) => onChange(field.fieldKey, e.target.value)}
                  className={inputBase}
                />
              </div>
            );

          // ── textarea ──────────────────────────────────────
          case 'textarea':
            return (
              <div key={field.id}>
                {label}
                <textarea
                  disabled={disabled}
                  rows={4}
                  placeholder={field.placeholder ?? ''}
                  value={(value as string) ?? ''}
                  onChange={(e) => onChange(field.fieldKey, e.target.value)}
                  className={`${inputBase} resize-none leading-relaxed`}
                />
              </div>
            );

          // ── date ──────────────────────────────────────────
          case 'date':
            return (
              <div key={field.id}>
                {label}
                <input
                  type="date"
                  disabled={disabled}
                  value={(value as string) ?? ''}
                  onChange={(e) => onChange(field.fieldKey, e.target.value)}
                  className={inputBase}
                />
              </div>
            );

          // ── select (single) ───────────────────────────────
          case 'select': {
            const options = field.options ?? [];
            return (
              <div key={field.id}>
                {label}
                <select
                  disabled={disabled}
                  value={(value as string) ?? ''}
                  onChange={(e) => onChange(field.fieldKey, e.target.value)}
                  className={inputBase}
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
          }

          // ── multiselect (checkbox list) ───────────────────
          case 'multiselect': {
            const options = field.options ?? [];
            const selected = (value as string[]) ?? [];
            const toggle = (opt: string) => {
              const next = selected.includes(opt)
                ? selected.filter((s) => s !== opt)
                : [...selected, opt];
              onChange(field.fieldKey, next);
            };
            return (
              <div key={field.id}>
                {label}
                <div className="space-y-2">
                  {options.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2.5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={selected.includes(opt)}
                        onChange={() => toggle(opt)}
                        className="w-4 h-4 rounded border-border-primary text-[#0d9488] accent-[#0d9488]"
                      />
                      <span className="text-sm text-text-primary">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          }

          // ── chips (single select pills) ───────────────────
          case 'chips': {
            const options = field.options ?? [];
            return (
              <div key={field.id}>
                {label}
                <div className="flex flex-wrap gap-2">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={disabled}
                      onClick={() => onChange(field.fieldKey, value === opt ? '' : opt)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        value === opt
                          ? 'bg-[#0d9488] text-white border-[#0d9488]'
                          : 'border-border-primary text-text-secondary hover:border-[#0d9488] hover:text-[#0d9488]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          // ── multichips (multi select pills) ──────────────
          case 'multichips': {
            const options = field.options ?? [];
            const selected = (value as string[]) ?? [];
            const toggle = (opt: string) => {
              const next = selected.includes(opt)
                ? selected.filter((s) => s !== opt)
                : [...selected, opt];
              onChange(field.fieldKey, next);
            };
            return (
              <div key={field.id}>
                {label}
                <div className="flex flex-wrap gap-2">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggle(opt)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        selected.includes(opt)
                          ? 'bg-[#0d9488] text-white border-[#0d9488]'
                          : 'border-border-primary text-text-secondary hover:border-[#0d9488] hover:text-[#0d9488]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          // ── address (Google Places autocomplete) ─────────
          case 'address':
            return (
              <div key={field.id}>
                {label}
                <AddressAutocomplete
                  value={(value as string) ?? ''}
                  onChange={(val) => onChange(field.fieldKey, val)}
                  placeholder={field.placeholder ?? '请输入地址'}
                  required={field.required}
                  disabled={disabled}
                  className={inputBase}
                />
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
