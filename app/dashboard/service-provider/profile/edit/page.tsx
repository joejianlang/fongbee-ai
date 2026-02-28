'use client';

import { useState } from 'react';
import { Camera, User } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

export default function EditProfilePage() {
  const [name, setName] = useState('雪王');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const inputClass =
    'w-full px-4 py-3 text-sm bg-[#253344] border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#10b981]/40 focus:border-[#10b981] transition-all';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // TODO: Call API to save profile
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <PageHeader title="编辑个人资料" />

      <div className="px-4">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#253344] flex items-center justify-center">
              <User size={40} className="text-[#10b981]" />
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#10b981] rounded-full flex items-center justify-center">
              <Camera size={16} className="text-white" />
            </button>
          </div>
          <p className="text-gray-400 text-xs mt-2">点击更换头像</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">姓名 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="您的真实姓名"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">职业头衔</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：专业水管工、电气技术员"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">个人简介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="介绍您的专业经验和服务特点..."
              className={inputClass + ' resize-none h-24'}
              rows={4}
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1-416-555-0000"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-[#10b981] text-white font-semibold rounded-xl hover:bg-[#0ea572] transition-all disabled:opacity-50 mt-4"
          >
            {saving ? '保存中...' : saved ? '✓ 已保存' : '保存'}
          </button>
        </form>
      </div>
    </div>
  );
}
