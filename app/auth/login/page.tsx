'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import { signIn } from 'next-auth/react';

/* ── Google SVG icon ─────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

export default function LoginPage() {
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  /* 2FA state (for ADMIN logins) */
  const [step,        setStep]        = useState<'input' | '2fa'>('input');
  const [sessionId,   setSessionId]   = useState('');
  const [twoFACode,   setTwoFACode]   = useState('');

  const inputClass =
    'w-full px-4 py-3.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] focus:bg-white transition-all';

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
      window.location.href = '/';
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
    <div className="min-h-screen bg-gradient-to-br from-[#e6fdf8] via-[#d5f7f0] to-[#c3f0e7] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl px-8 py-9">

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          {step === 'input' ? (
            <>
              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-800 mb-7">登录.</h1>

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
                  className="w-full py-3.5 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0a7c71] active:bg-[#086e63] transition-all disabled:opacity-60 mt-2 shadow-md shadow-[#0d9488]/20"
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
                <Link href="/terms" className="text-[#0d9488] hover:underline">《用户注册协议》</Link>
                {' '}及{' '}
                <Link href="/privacy" className="text-[#0d9488] hover:underline">《隐私政策/保密协议》</Link>
              </p>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">更多登录方式</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Google login */}
              <button
                onClick={() => alert('Google 登录即将开通，敬请期待！')}
                className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <GoogleIcon />
                使用 Google 账号登录
              </button>

              {/* Register link */}
              <p className="text-sm text-gray-500 text-center mt-5">
                还没有账号？{' '}
                <Link href="/auth/register" className="text-[#0d9488] font-semibold hover:underline">
                  立即注册
                </Link>
              </p>
            </>
          ) : (
            /* 2FA Step */
            <>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">安全验证</h1>
              <p className="text-sm text-gray-500 mb-6">请输入发送到您邮箱的6位验证码</p>

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
                  className="w-full py-3.5 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0a7c71] transition-all disabled:opacity-60 shadow-md"
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
          <Link href="/" className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={15} />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
