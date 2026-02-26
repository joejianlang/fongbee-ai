'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Phone, Lock, AlertCircle } from 'lucide-react';

type LoginMethod = 'password' | 'code' | '2fa';

export default function SignInPage() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'verify' | '2fa'>('input');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');

  const inputClass =
    'w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all';

  // 第一步：输入邮箱/手机号和密码
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginMethod === 'password') {
        if (!identifier || !password) {
          setError('请输入邮箱/手机号和密码');
          return;
        }

        // 调用登录 API
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

        // 检查是否需要二次认证（管理员）
        if (data.requiresTwoFA) {
          setSessionId(data.sessionId);
          setUserRole(data.role);
          setStep('2fa');
        } else {
          // 保存 token 并重定向
          localStorage.setItem('auth_token', data.token);
          const redirectUrl = data.redirectUrl || '/dashboard';
          window.location.href = redirectUrl;
        }
      } else if (loginMethod === 'code') {
        // 验证码登录
        if (!identifier) {
          setError('请输入邮箱或手机号');
          return;
        }

        // 发送验证码
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

        setStep('verify');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 第二步：验证验证码（验证码登录）
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!verificationCode) {
        setError('请输入验证码');
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

      // 检查是否需要二次认证
      if (data.requiresTwoFA) {
        setUserRole(data.role);
        setStep('2fa');
      } else {
        localStorage.setItem('auth_token', data.token);
        const redirectUrl = data.redirectUrl || '/dashboard';
        window.location.href = redirectUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 第三步：二次认证（仅管理员）
  const handleTwoFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!verificationCode) {
        setError('请输入验证码');
        return;
      }

      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          code: verificationCode,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || '验证失败');
        return;
      }

      localStorage.setItem('auth_token', data.token);
      window.location.href = data.redirectUrl || '/admin';
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证失败，请重试');
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

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* 第一步：登录 */}
          {step === 'input' && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-6">登录</h2>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Login Method Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setLoginMethod('password')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    loginMethod === 'password'
                      ? 'bg-[#0d9488] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  密码登录
                </button>
                <button
                  onClick={() => setLoginMethod('code')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    loginMethod === 'code'
                      ? 'bg-[#0d9488] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {identifierType === 'email' ? '邮箱验证码' : '短信验证码'}
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Identifier Type Selector */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIdentifierType('email')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      identifierType === 'email'
                        ? 'bg-[#0d9488]/10 text-[#0d9488] border border-[#0d9488]'
                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                    }`}
                  >
                    邮箱
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentifierType('phone')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      identifierType === 'phone'
                        ? 'bg-[#0d9488]/10 text-[#0d9488] border border-[#0d9488]'
                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                    }`}
                  >
                    手机号
                  </button>
                </div>

                {/* Identifier Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {identifierType === 'email' ? '邮箱地址' : '手机号'} *
                  </label>
                  <div className="relative">
                    {identifierType === 'email' ? (
                      <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                    ) : (
                      <Phone size={18} className="absolute left-3 top-3 text-gray-400" />
                    )}
                    <input
                      type={identifierType === 'email' ? 'email' : 'tel'}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={identifierType === 'email' ? 'your@email.com' : '+1-416-555-0000'}
                      className={inputClass + ' pl-10'}
                      required
                    />
                  </div>
                </div>

                {/* Password (only for password login) */}
                {loginMethod === 'password' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      密码 *
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="输入密码"
                        className={inputClass + ' pl-10 pr-10'}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Forgot Password */}
                {loginMethod === 'password' && (
                  <div className="text-right">
                    <button
                      type="button"
                      className="text-sm text-[#0d9488] hover:text-[#0a7c71] font-medium transition-colors"
                    >
                      忘记密码？
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0a7c71] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
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
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-xs text-gray-500">或</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>

              {/* Sign Up Link */}
              <p className="text-sm text-gray-600 text-center">
                还没有账户？{' '}
                <Link href="/register/service-provider" className="text-[#0d9488] hover:text-[#0a7c71] font-semibold">
                  注册服务商
                </Link>
              </p>
            </>
          )}

          {/* 第二步：验证码验证 */}
          {step === 'verify' && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-2">输入验证码</h2>
              <p className="text-gray-600 text-sm mb-6">
                验证码已发送到您的{identifierType === 'email' ? '邮箱' : '手机号'}
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    验证码 *
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className={inputClass + ' text-center text-2xl tracking-widest font-bold'}
                    maxLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0a7c71] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '验证中...' : '验证'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setVerificationCode('');
                    setError('');
                  }}
                  className="w-full py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors"
                >
                  返回
                </button>
              </form>
            </>
          )}

          {/* 第三步：二次认证（仅管理员） */}
          {step === '2fa' && (
            <>
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">🔒 安全验证</p>
                  <p className="text-xs text-amber-700">
                    请输入发送到您邮箱的验证码以完成登录
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleTwoFA} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    验证码 (6位) *
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                  className="w-full py-3 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0a7c71] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '验证中...' : '验证并登录'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-6 px-2">
          继续表示您同意{' '}
          <Link href="/terms" className="text-[#0d9488] hover:underline">
            服务条款
          </Link>
          {' '}和{' '}
          <Link href="/privacy" className="text-[#0d9488] hover:underline">
            隐私政策
          </Link>
        </p>
      </div>
    </div>
  );
}
