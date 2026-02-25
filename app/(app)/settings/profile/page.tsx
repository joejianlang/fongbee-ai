'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, Save } from 'lucide-react';

export default function SettingsProfilePage() {
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
          <ArrowLeft size={18} />返回
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">个人信息</span>
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
          <p className="text-xs text-text-muted">点击更换头像</p>
        </div>

        {/* 表单 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4 space-y-4">
          {[
            { label: '昵称',   value: name,  set: setName,  type: 'text' },
            { label: '手机号', value: phone, set: setPhone, type: 'tel'  },
            { label: '邮箱',   value: email, set: setEmail, type: 'email'},
            { label: '所在城市',value: city, set: setCity,  type: 'text' },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-xs font-medium text-text-muted mb-1.5">{field.label}</label>
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
          {saved ? '已保存 ✓' : '保存修改'}
        </button>
      </div>
    </div>
  );
}
