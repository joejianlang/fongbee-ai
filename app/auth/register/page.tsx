'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
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

export default function RegisterPage() {
  const [email,           setEmail]           = useState('');
  const [code,            setCode]            = useState('');
  const [name,            setName]            = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd,         setShowPwd]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [agreed,          setAgreed]          = useState(false);

  const [sending,         setSending]         = useState(false);
  const [codeSent,        setCodeSent]        = useState(false);
  const [countdown,       setCountdown]       = useState(0);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState('');

  const inputClass =
    'w-full px-4 py-3.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] focus:bg-white transition-all';

  /* ── Send verification code ─────────────────────────────────────── */
  const startCountdown = useCallback(() => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSendCode = useCallback(async () => {
    if (!email) { setError('请先输入邮箱地址'); return; }
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/auth/send-register-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || '发送失败'); return; }
      setCodeSent(true);
      startCountdown();
    } catch {
      setError('发送验证码失败，请重试');
    } finally {
      setSending(false);
    }
  }, [email, startCountdown]);

  /* ── Submit registration ────────────────────────────────────────── */
  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreed) { setError('请先阅读并同意用户协议'); return; }
    if (password !== confirmPassword) { setError('两次密码输入不一致'); return; }
    if (!codeSent) { setError('请先获取邮箱验证码'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-consumer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, name, password, confirmPassword }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || '注册失败'); return; }

      setSuccess('注册成功，正在登录...');
      localStorage.setItem('auth_token', data.token);
      await signIn('token', { token: data.token, redirect: false });
      window.location.href = '/';
    } catch {
      setError('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [agreed, password, confirmPassword, codeSent, email, code, name]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6fdf8] via-[#d5f7f0] to-[#c3f0e7] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl px-8 py-9">

          {/* Header */}
          <div className="mb-7">
            <h1 className="text-3xl font-black italic text-[#0d9488] tracking-tight">数位 Buffet</h1>
            <h2 className="text-xl font-bold text-gray-800 mt-1">极速注册</h2>
            <p className="text-xs italic text-gray-400 mt-0.5">discover the hidden depth.</p>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-xs leading-relaxed">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex gap-2">
              <CheckCircle size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 text-xs">{success}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="your@email.com"
                className={inputClass}
                required
                autoComplete="email"
              />
            </div>

            {/* Verification code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">验证码</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6位验证码"
                  className={inputClass + ' flex-1'}
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sending || countdown > 0}
                  className="flex-shrink-0 px-4 py-2 bg-[#0d9488] text-white text-sm font-semibold rounded-xl hover:bg-[#0a7c71] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {sending
                    ? '发送中...'
                    : countdown > 0
                    ? `${countdown}s`
                    : codeSent
                    ? '重新发送'
                    : '获取验证码'}
                </button>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="username"
                className={inputClass}
                required
                autoComplete="username"
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
                  placeholder="至少6个字符"
                  className={inputClass + ' pr-12'}
                  minLength={6}
                  required
                  autoComplete="new-password"
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

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">确认密码</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  className={inputClass + ' pr-12'}
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0a7c71] active:bg-[#086e63] transition-all disabled:opacity-60 shadow-md shadow-[#0d9488]/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  注册中...
                </span>
              ) : '立即开启 Buff'}
            </button>
          </form>

          {/* Terms checkbox */}
          <div className="flex items-start gap-2 mt-4">
            <input
              id="agree"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#0d9488] cursor-pointer"
            />
            <label htmlFor="agree" className="text-xs text-gray-400 leading-relaxed cursor-pointer">
              阅读并同意支付{' '}
              <Link href="/terms" className="text-[#0d9488] hover:underline">《用户注册协议》</Link>
              {' '}及{' '}
              <Link href="/privacy" className="text-[#0d9488] hover:underline">《隐私政策/保密协议》</Link>
            </label>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">更多方式</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google */}
          <button
            onClick={() => alert('Google 登录即将开通，敬请期待！')}
            className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <GoogleIcon />
            使用 Google 账号快捷登录
          </button>

          {/* Login link */}
          <p className="text-sm text-gray-500 text-center mt-5">
            已有账号？{' '}
            <Link href="/auth/login" className="text-[#0d9488] font-semibold hover:underline">
              立即登录
            </Link>
          </p>
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
