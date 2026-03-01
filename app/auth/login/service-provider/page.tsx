'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, AlertCircle, Briefcase } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function ServiceProviderLoginPage() {
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  /* 2FA state (for ADMIN logins) */
  const [step,       setStep]       = useState<'input' | '2fa'>('input');
  const [sessionId,  setSessionId]  = useState('');
  const [twoFACode,  setTwoFACode]  = useState('');

  const inputClass =
    'w-full px-4 py-3.5 text-sm border border-gray-200 rounded-xl bg-slate-50 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all';

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, identifierType: 'email', password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || '邮箱或密码错误'); return; }

      if (data.requiresTwoFA) {
        setSessionId(data.sessionId);
        setStep('2fa');
        return;
      }

      localStorage.setItem('auth_token', data.token);
      await signIn('token', { token: data.token, redirect: false });
      window.location.href = data.redirectUrl || '/';
    } catch {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  const handleTwoFA = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, code: twoFACode }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || '验证失败'); return; }

      localStorage.setItem('auth_token', data.token);
      await signIn('token', { token: data.token, redirect: false });
      window.location.href = data.redirectUrl || '/admin';
    } catch {
      setError('验证失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [sessionId, twoFACode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-teal-800 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl px-8 py-9">

          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-slate-600 flex items-center justify-center shadow">
              <Briefcase size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 leading-none">
                {step === 'input' ? '商家登录.' : '安全验证'}
              </h1>
              {step === 'input' && (
                <p className="text-xs text-gray-400 mt-0.5">服务商 · 销售合伙人 · 管理员</p>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          {step === 'input' ? (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={inputClass}
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass + ' pr-12'}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Login button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-slate-700 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-slate-800 active:opacity-90 transition-all disabled:opacity-60 mt-2 shadow-md"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      处理中...
                    </span>
                  ) : '立即登录'}
                </button>
              </form>

              {/* Terms */}
              <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
                登录即代表您同意{' '}
                <Link href="/terms" className="text-teal-600 hover:underline">《服务条款》</Link>
                {' '}及{' '}
                <Link href="/privacy" className="text-teal-600 hover:underline">《隐私政策》</Link>
              </p>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">注册入口</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Register links */}
              <div className="space-y-2.5">
                <Link
                  href="/register/service-provider"
                  className="w-full flex items-center justify-center gap-2 py-3 border border-teal-200 rounded-xl text-sm font-medium text-teal-700 hover:bg-teal-50 transition-colors"
                >
                  <Briefcase size={16} />
                  服务商注册
                </Link>
                <div className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed select-none">
                  🔒 销售合伙人注册（需要邀请链接）
                </div>
              </div>

              {/* Switch to consumer login */}
              <p className="text-xs text-gray-400 text-center mt-5">
                普通用户？{' '}
                <Link href="/auth/login" className="text-teal-600 font-medium hover:underline">
                  切换到消费者登录
                </Link>
              </p>
            </>
          ) : (
            /* 2FA Step */
            <>
              <p className="text-sm text-gray-500 mb-6">请输入发送到您邮箱的 6 位验证码</p>

              <form onSubmit={handleTwoFA} className="space-y-4">
                <input
                  type="text"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className={inputClass + ' text-center text-2xl tracking-widest font-bold'}
                  maxLength={6}
                  required
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-slate-700 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-slate-800 transition-all disabled:opacity-60 shadow-md"
                >
                  {loading ? '验证中...' : '验证并登录'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('input'); setTwoFACode(''); setError(''); }}
                  className="w-full py-2 text-gray-500 text-sm hover:bg-gray-50 rounded-lg transition-colors"
                >
                  返回
                </button>
              </form>
            </>
          )}
        </div>

        {/* Back to home */}
        <div className="text-center mt-5">
          <Link href="/" className="flex items-center justify-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors">
            <ArrowLeft size={15} />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
