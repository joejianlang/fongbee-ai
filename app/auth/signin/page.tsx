'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Phone, Lock, AlertCircle } from 'lucide-react';
import { signIn } from 'next-auth/react';

type LoginMethod = 'password' | 'code';
type Step = 'input' | '2fa';

export default function SignInPage() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [sessionId, setSessionId] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const inputClass =
    'w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all';

  // Auto-detect identifier type based on input
  const handleIdentifierChange = useCallback((value: string) => {
    setIdentifier(value);
    setError('');
    // If contains @, treat as email; if starts with + or is all digits, treat as phone
    if (value.includes('@')) {
      setIdentifierType('email');
    } else if (/^[\d\s\-\+\(\)]+$/.test(value) && value.length > 0) {
      setIdentifierType('phone');
    }
  }, []);

  // Start countdown timer
  const startCountdown = useCallback(() => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Send verification code
  const handleSendCode = async () => {
    if (!identifier) {
      setError('请输入邮箱或手机号');
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          identifierType,
          codeType: 'LOGIN',
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || '发送验证码失败');
        return;
      }

      setCodeSent(true);
      startCountdown();
    } catch {
      setError('发送验证码失败，请重试');
    } finally {
      setSendingCode(false);
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreedToTerms) {
      setError('请先同意服务条款和隐私政策');
      return;
    }

    setLoading(true);

    try {
      if (loginMethod === 'password') {
        if (!identifier || !password) {
          setError('请输入邮箱/手机号和密码');
          return;
        }

        const res = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier,
            identifierType,
            password,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error || '登录失败');
          return;
        }

        if (data.requiresTwoFA) {
          setSessionId(data.sessionId);
          setStep('2fa');
        } else {
          // Bridge custom JWT → NextAuth session cookie so getServerSession() works
          localStorage.setItem('auth_token', data.token);
          await signIn('token', { token: data.token, redirect: false });
          window.location.href = data.redirectUrl || '/dashboard';
        }
      } else {
        // Verification code login
        if (!identifier || !verificationCode) {
          setError('请输入邮箱/手机号和验证码');
          return;
        }

        const res = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier,
            identifierType,
            code: verificationCode,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error || '验证失败');
          return;
        }

        if (data.requiresTwoFA) {
          setSessionId(data.sessionId);
          setStep('2fa');
        } else {
          // Bridge custom JWT → NextAuth session cookie
          localStorage.setItem('auth_token', data.token);
          await signIn('token', { token: data.token, redirect: false });
          window.location.href = data.redirectUrl || '/dashboard';
        }
      }
    } catch {
      setError('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA verification (admin only)
  const handleTwoFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!twoFACode) {
        setError('请输入验证码');
        return;
      }

      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          code: twoFACode,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || '验证失败');
        return;
      }

      // Bridge custom JWT → NextAuth session cookie so admin API getServerSession() works
      localStorage.setItem('auth_token', data.token);
      await signIn('token', { token: data.token, redirect: false });
      window.location.href = data.redirectUrl || '/admin';
    } catch {
      setError('验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0d9488] to-[#0a7c71] flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-black text-2xl">优</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">优服佳</h1>
          <p className="text-gray-600 text-sm mt-1">您身边的服务专家</p>
        </div>

        {step === 'input' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Login Method Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => {
                  setLoginMethod('password');
                  setError('');
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  loginMethod === 'password'
                    ? 'bg-[#0d9488] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                密码登录
              </button>
              <button
                onClick={() => {
                  setLoginMethod('code');
                  setError('');
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  loginMethod === 'code'
                    ? 'bg-[#0d9488] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                验证码登录
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Identifier Input (auto-detect email/phone) */}
              <div>
                <div className="relative">
                  {identifierType === 'email' ? (
                    <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                  ) : (
                    <Phone size={18} className="absolute left-3 top-3.5 text-gray-400" />
                  )}
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => handleIdentifierChange(e.target.value)}
                    placeholder="请输入邮箱或手机号"
                    className={inputClass + ' pl-10'}
                    required
                  />
                </div>
              </div>

              {/* Password (password login mode) */}
              {loginMethod === 'password' && (
                <div>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      className={inputClass + ' pl-10 pr-10'}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Verification Code (code login mode) */}
              {loginMethod === 'code' && (
                <div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="请输入验证码"
                      className={inputClass + ' flex-1'}
                      maxLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={sendingCode || countdown > 0 || !identifier}
                      className="px-4 py-3 text-sm font-medium rounded-xl whitespace-nowrap transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#0d9488]/10 text-[#0d9488] hover:bg-[#0d9488]/20 border border-[#0d9488]/30"
                    >
                      {sendingCode
                        ? '发送中...'
                        : countdown > 0
                        ? `${countdown}s`
                        : codeSent
                        ? '重新发送'
                        : '获取验证码'}
                    </button>
                  </div>
                </div>
              )}

              {/* Terms Agreement Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#0d9488] focus:ring-[#0d9488] cursor-pointer accent-[#0d9488]"
                />
                <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                  登录代表同意{' '}
                  <Link href="/terms" className="text-[#0d9488] hover:underline">
                    《服务协议》
                  </Link>
                  {' '}和{' '}
                  <Link href="/privacy" className="text-[#0d9488] hover:underline">
                    《隐私政策》
                  </Link>
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0a7c71] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    处理中...
                  </span>
                ) : (
                  '登录'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">或</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Sign Up Link */}
            <p className="text-sm text-gray-600 text-center">
              还没有账户？{' '}
              <Link href="/register/service-provider" className="text-[#0d9488] hover:text-[#0a7c71] font-semibold">
                立即注册
              </Link>
            </p>
          </div>
        )}

        {/* 2FA Step (admin only) */}
        {step === '2fa' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">安全验证</p>
                <p className="text-xs text-amber-700">
                  请输入发送到您邮箱的验证码以完成登录
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleTwoFA} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  验证码 (6位)
                </label>
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
                <p className="text-xs text-gray-500 mt-2">
                  请输入发送到您邮箱中的6位验证码
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0a7c71] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? '验证中...' : '验证并登录'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setTwoFACode('');
                  setError('');
                }}
                className="w-full py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
              >
                返回
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center mt-6 px-2">
          &copy; 2024 优服佳 版权所有
        </p>
      </div>
    </div>
  );
}
