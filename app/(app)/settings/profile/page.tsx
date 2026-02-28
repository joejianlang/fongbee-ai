'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Camera, Save } from 'lucide-react';

export default function SettingsProfilePage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');

  const [name,    setName]    = useState('王小明');
  const [phone,   setPhone]   = useState('+1 (519) 555-0188');
  const [email,   setEmail]   = useState('xiaoming@example.com');
  const [city,    setCity]    = useState('Guelph');
  const [saved,   setSaved]   = useState(false);

  const inputClass = "w-full px-3 py-2.5 text-sm border border-border-primary rounded-lg bg-background text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40";

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="pb-6">
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors">
          <ArrowLeft size={18} />{tCommon('back')}
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">{t('profileTitle')}</span>
      </div>

      <div className="px-4 md:px-0 mt-6 space-y-5">
        {/* 头像 */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[#0d9488]/20 text-[#0d9488] flex items-center justify-center text-3xl font-bold">
              {name[0]}
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 bg-[#0d9488] rounded-full flex items-center justify-center shadow-md">
              <Camera size={14} className="text-white" />
            </button>
          </div>
          <p className="text-xs text-text-muted">{t('tapToChangeAvatar')}</p>
        </div>

        {/* 表单 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4 space-y-4">
          {[
            { label: t('nickname'),  value: name,  set: setName,  type: 'text' },
            { label: t('phone'),     value: phone, set: setPhone, type: 'tel'  },
            { label: t('email'),     value: email, set: setEmail, type: 'email'},
            { label: t('cityField'), value: city,  set: setCity,  type: 'text' },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-sm font-medium text-text-muted mb-1.5">{field.label}</label>
              <input
                type={field.type}
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                className={inputClass}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
            saved ? 'bg-green-500 text-white' : 'bg-[#0d9488] text-white hover:bg-[#0a7c71]'
          }`}
        >
          <Save size={16} />
          {saved ? t('saved') : t('saveChanges')}
        </button>
      </div>
    </div>
  );
}
