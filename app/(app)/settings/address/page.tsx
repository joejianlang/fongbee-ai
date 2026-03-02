'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, MapPin, Plus, Trash2, Home, Briefcase } from 'lucide-react';
import AddressAutocomplete, { AddressDetails } from '@/components/AddressAutocomplete';

interface Address {
  id: string;
  label: string;
  icon: 'home' | 'work' | 'other';
  line1: string;
  city: string;
  province: string;
  postal: string;
  isDefault: boolean;
}

const ICONS = { home: Home, work: Briefcase, other: MapPin };

export default function AddressPage() {
  const t = useTranslations('address');
  const tSettings = useTranslations('settings');
  const tCommon = useTranslations('common');

  const [addresses, setAddresses] = useState<Address[]>([
    { id: '1', label: '家', icon: 'home', line1: '123 Gordon St', city: 'Guelph', province: 'ON', postal: 'N1G 1Y1', isDefault: true },
    { id: '2', label: '公司', icon: 'work', line1: '50 Stone Rd W', city: 'Guelph', province: 'ON', postal: 'N1G 2W1', isDefault: false },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: '', line1: '', city: '', province: 'ON', postal: '' });

  const remove = (id: string) => setAddresses((prev) => prev.filter((a) => a.id !== id));
  const setDefault = (id: string) => setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));

  const addAddress = () => {
    if (!form.line1 || !form.city) return;
    const { label: formLabel, ...formRest } = form;
    setAddresses((prev) => [
      ...prev,
      { id: Date.now().toString(), label: formLabel || t('newAddress'), icon: 'other' as const, ...formRest, isDefault: false },
    ]);
    setForm({ label: '', line1: '', city: '', province: 'ON', postal: '' });
    setShowForm(false);
  };

  const inputClass = "w-full px-3 py-2.5 text-sm border border-border-primary rounded-lg bg-background text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40";

  return (
    <div className="pb-6">
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors">
          <ArrowLeft size={18} />{tCommon('back')}
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">{tSettings('addressTitle')}</span>
        <button onClick={() => setShowForm(true)} className="ml-auto flex items-center gap-1 text-xs text-[#0d9488]">
          <Plus size={14} />{t('addNew')}
        </button>
      </div>

      <div className="px-4 md:px-0 mt-3 space-y-3">
        {addresses.map((a) => {
          const Icon = ICONS[a.icon];
          return (
            <div key={a.id} className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0d9488]/10 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-[#0d9488]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-text-primary dark:text-white">{a.label}</p>
                  {a.isDefault && <span className="text-xs bg-[#0d9488]/10 text-[#0d9488] px-2 py-0.5 rounded-full">{t('default')}</span>}
                </div>
                <p className="text-xs text-text-secondary">{a.line1}, {a.city}, {a.province} {a.postal}</p>
                <div className="flex gap-3 mt-2">
                  {!a.isDefault && (
                    <button onClick={() => setDefault(a.id)} className="text-xs text-[#0d9488] hover:underline">{t('setDefault')}</button>
                  )}
                  <button onClick={() => remove(a.id)} className="text-xs text-red-400 hover:underline flex items-center gap-0.5">
                    <Trash2 size={11} />{t('delete')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {showForm && (
          <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4 space-y-3">
            <p className="font-semibold text-sm text-text-primary dark:text-white">{t('newAddress')}</p>

            {/* Label field */}
            <div>
              <label className="block text-xs text-text-muted mb-1">{t('labelField')}</label>
              <input
                className={inputClass}
                placeholder="家"
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
              />
            </div>

            {/* Street — Google Places autocomplete */}
            <div>
              <label className="block text-xs text-text-muted mb-1">{t('streetField')}</label>
              <AddressAutocomplete
                value={form.line1}
                onChange={(val, details?: AddressDetails) => {
                  if (details) {
                    setForm((prev) => ({
                      ...prev,
                      line1:    val,
                      city:     details.city     || prev.city,
                      province: details.province || prev.province,
                      postal:   details.postalCode || prev.postal,
                    }));
                  } else {
                    setForm((prev) => ({ ...prev, line1: val }));
                  }
                }}
                placeholder="123 Main St"
                className={inputClass}
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs text-text-muted mb-1">{t('cityField')}</label>
              <input
                className={inputClass}
                placeholder="Guelph"
                value={form.city}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              />
            </div>

            {/* Postal */}
            <div>
              <label className="block text-xs text-text-muted mb-1">{t('postalField')}</label>
              <input
                className={inputClass}
                placeholder="N1G 1Y1"
                value={form.postal}
                onChange={(e) => setForm((prev) => ({ ...prev, postal: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={addAddress} className="flex-1 py-2.5 bg-[#0d9488] text-white rounded-lg text-sm font-medium hover:bg-[#0a7c71]">{t('save')}</button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-border-primary text-text-secondary rounded-lg text-sm hover:bg-gray-50">{t('cancel')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
