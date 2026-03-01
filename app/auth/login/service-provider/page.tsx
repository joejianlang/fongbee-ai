'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { signIn } from 'next-auth/react';

type LoginMode = 'password' | 'code';
type LoginStep = 'input' | '2fa';

const getIdentifierType = (v: string): 'email' | 'phone' =>
  v.includes('@') ? 'email' : 'phone';

export default function ServiceProviderLoginPage() {
  /* shared */
  const [identifier,  setIdentifier]  = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [loginMode,   setLoginMode]   = useState<LoginMode>('password');

  /* password tab */
  const [password,    setPassword]    = useState('');
  const [showPwd,     setShowPwd]     = useState(false);

  /* code tab */
  const [loginCode,   setLoginCode]   = useState('');
  const [countdown,   setCountdown]   = useState(0);
  const [codeSent,    setCodeSent]    = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* 2FA (admin) */
  const [step,        setStep]        = useState<LoginStep>('input');
  const [sessionId,   setSessionId]   = useState('');
  const [twoFACode,   setTwoFACode]   = useState('');

  const inputClass =
    'w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] focus:bg-white transition-all';

  /* ─── Password login ──────────────────────────────────────────── */
  const handlePasswordLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          identifierType: getIdentifierType(identifier),
          password,
        }),
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
  }, [identifier, password]);

  /* ─── Send verification code ──────────────────────────────────── */
  const handleSendCode = useCallback(async () => {
    if (!identifier) { setError('请输入邮箱或手机号'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          identifierType: getIdentifierType(identifier),
          codeType: 'LOGIN',
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || '发送失败'); return; }

      setCodeSent(true);
      setCountdown(60);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch {
      setError('发送失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  /* ─── Code login ─────────────────────────────────────────────── */
  const handleCodeLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          identifierType: getIdentifierType(identifier),
          code: loginCode,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || '验证失败'); return; }

      if (data.requiresTwoFA) {
        setSessionId(data.sessionId);
        setStep('2fa');
        return;
      }

      localStorage.setItem('auth_token', data.token);
      await signIn('token', { token: data.token, redirect: false });
      window.location.href = data.redirectUrl || '/';
    } catch {
      setError('验证失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [identifier, loginCode]);

  /* ─── 2FA verify ─────────────────────────────────────────────── */
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

  /* ─── Tab switch helper ──────────────────────────────────────── */
  const switchMode = (mode: LoginMode) => {
    setLoginMode(mode);
    setError('');
    setLoginCode('');
    setPassword('');
  };

  /* ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">

      {/* Branding */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0d9488] to-emerald-400 shadow-lg mb-4">
          <span className="text-white font-black text-2xl">优</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">优服佳</h1>
        <p className="text-sm text-gray-500 mt-1">您身边的服务专家</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md px-8 py-8">

        {/* 2FA step */}
        {step === '2fa' ? (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">安全验证</h2>
            <p className="text-sm text-gray-500 mb-6">请输入发送到您邮箱的 6 位验证码</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2">
                <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-xs leading-relaxed">{error}</p>
              </div>
            )}

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
                className="w-full py-3 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0b8276] transition-colors disabled:opacity-60"
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
        ) : (
          <>
            {/* Tab bar */}
            <div className="flex border-b border-gray-200 mb-6">
              {(['password', 'code'] as LoginMode[]).map((mode) => {
                const label = mode === 'password' ? '密码登录' : '验证码登录';
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => switchMode(mode)}
                    className={`flex-1 pb-2.5 text-sm font-medium transition-colors ${
                      loginMode === mode
                        ? 'text-[#0d9488] border-b-2 border-[#0d9488] -mb-px'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2">
                <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            {/* ── Password tab ── */}
            {loginMode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    邮箱 / 手机号
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="邮箱或手机号码"
                    className={inputClass}
                    required
                    autoComplete="username"
                  />
                </div>

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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0b8276] active:opacity-90 transition-colors disabled:opacity-60 mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      处理中...
                    </span>
                  ) : '立即登录'}
                </button>
              </form>
            )}

            {/* ── Code tab ── */}
            {loginMode === 'code' && (
              <form onSubmit={handleCodeLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    邮箱 / 手机号
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="邮箱或手机号码"
                      className={inputClass}
                      required
                      autoComplete="username"
                    />
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={loading || countdown > 0}
                      className="flex-shrink-0 px-3 py-3 text-xs font-medium rounded-xl border border-[#0d9488] text-[#0d9488] hover:bg-[#0d9488]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </button>
                  </div>
                  {codeSent && countdown > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      验证码已发送，请查收{identifier.includes('@') ? '邮箱' : '短信'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">验证码</label>
                  <input
                    type="text"
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6 位验证码"
                    className={inputClass + ' tracking-widest text-center font-bold text-lg'}
                    maxLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !codeSent}
                  className="w-full py-3 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0b8276] active:opacity-90 transition-colors disabled:opacity-60 mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      处理中...
                    </span>
                  ) : '立即登录'}
                </button>
              </form>
            )}

            {/* Register link */}
            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <Link
                href="/register/service-provider"
                className="text-sm text-[#0d9488] font-medium hover:underline"
              >
                注册成为服务商 →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
