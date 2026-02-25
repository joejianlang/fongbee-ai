'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [tab,      setTab]      = useState<'login' | 'register'>('login');
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [name,     setName]     = useState('');

  const inputClass = "w-full px-4 py-3 text-sm border border-border-primary rounded-xl bg-background text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40 transition-colors";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 顶部 */}
      <div className="flex items-center gap-3 px-4 py-4">
        <Link href="/profile" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors">
          <ArrowLeft size={18} />返回
        </Link>
      </div>

      {/* Logo区域 */}
      <div className="flex flex-col items-center pt-6 pb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#0d9488] flex items-center justify-center mb-4 shadow-lg">
          <span className="text-white font-black text-2xl">数</span>
        </div>
        <h1 className="text-xl font-bold text-text-primary dark:text-white">数位 Buffet</h1>
        <p className="text-text-muted text-sm mt-1">华人本地生活服务平台</p>
      </div>

      <div className="flex-1 px-5 max-w-sm mx-auto w-full">
        {/* Tab */}
        <div className="flex bg-gray-100 dark:bg-[#2d2d30] rounded-xl p-1 mb-6">
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                tab === t ? 'bg-white dark:bg-[#1e1e1e] text-text-primary dark:text-white shadow-sm' : 'text-text-muted'
              }`}
            >
              {t === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {tab === 'register' && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="昵称"
              className={inputClass}
            />
          )}
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="手机号"
            className={inputClass}
          />
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              className={inputClass + ' pr-12'}
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {tab === 'login' && (
          <button className="w-full text-right text-xs text-[#0d9488] mt-2 hover:underline">
            忘记密码？
          </button>
        )}

        <Link
          href="/"
          className="block w-full bg-[#0d9488] text-white text-center py-3.5 rounded-xl font-semibold text-sm mt-5 hover:bg-[#0a7c71] transition-colors"
        >
          {tab === 'login' ? '登录' : '注册并登录'}
        </Link>

        {/* 分割线 */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border-primary" />
          <span className="text-xs text-text-muted">或</span>
          <div className="flex-1 h-px bg-border-primary" />
        </div>

        {/* 第三方登录 */}
        <div className="space-y-3">
          <button className="w-full flex items-center justify-center gap-3 py-3 border border-border-primary rounded-xl text-sm text-text-secondary hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <span className="text-base">🍎</span>
            使用 Apple 登录
          </button>
          <button className="w-full flex items-center justify-center gap-3 py-3 border border-border-primary rounded-xl text-sm text-text-secondary hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <span className="text-base">📧</span>
            使用邮箱登录
          </button>
        </div>

        <p className="text-xs text-text-muted text-center mt-6 px-4">
          继续即代表您同意{' '}
          <Link href="/about" className="text-[#0d9488] hover:underline">服务条款</Link>
          {' '}和{' '}
          <Link href="/settings/privacy" className="text-[#0d9488] hover:underline">隐私政策</Link>
        </p>
      </div>
    </div>
  );
}
