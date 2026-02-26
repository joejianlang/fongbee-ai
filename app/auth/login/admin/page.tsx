'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, Lock, AlertCircle, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'login' | '2fa'>('login');

  const inputClass =
    'w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('请输入邮箱和密码');
        return;
      }

      // Simulate API call
      console.log('Admin Login:', { email, password });

      // Move to 2FA step
      setTimeout(() => {
        setStep('2fa');
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
      setLoading(false);
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!twoFACode || twoFACode.length !== 6) {
        setError('请输入有效的6位验证码');
        return;
      }

      console.log('2FA Code:', twoFACode);

      // Simulate successful 2FA
      setTimeout(() => {
        setLoading(false);
        // Redirect to admin dashboard
        window.location.href = '/admin';
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证失败，请重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <Link
          href="/auth"
          className="flex items-center gap-1.5 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={18} />
          返回
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">管理员登录</h1>
            <p className="text-gray-600 text-sm mt-1">优服佳平台管理系统</p>
          </div>

          {/* Security Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
            <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">🔒 安全登录</p>
              <p className="text-xs text-amber-700">
                此为限制访问区域。登录需经过两步验证，所有操作将被记录。
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {step === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  邮箱地址 *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@youfujia.ca"
                  className={inputClass}
                  required
                  autoFocus
                />
              </div>

              {/* Password */}
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

              {/* Forgot Password */}
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-[#0d9488] hover:text-[#0a7c71] font-medium transition-colors"
                >
                  忘记密码？
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    验证中...
                  </span>
                ) : (
                  '下一步'
                )}
              </button>
            </form>
          ) : (
            /* 2FA Form */
            <form onSubmit={handle2FA} className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  验证码已发送到您的注册邮箱
                </p>
                <p className="text-xs text-gray-500">
                  {email}
                </p>
              </div>

              {/* 2FA Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  验证码 *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className={
                      inputClass +
                      ' text-center text-2xl tracking-widest font-bold'
                    }
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  请输入发送到您邮箱中的6位验证码
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    验证中...
                  </span>
                ) : (
                  '验证并登录'
                )}
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => {
                  setStep('login');
                  setError('');
                  setTwoFACode('');
                }}
                className="w-full py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors"
              >
                返回
              </button>
            </form>
          )}

          {/* Footer */}
          <p className="text-xs text-gray-500 text-center mt-8 px-2">
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

      {/* Footer Info */}
      <div className="px-4 py-4 bg-white border-t border-gray-200 text-center space-y-2">
        <p className="text-xs text-gray-600">
          登录问题？
          <Link href="/admin/support" className="text-[#0d9488] hover:underline ml-1">
            管理员支持
          </Link>
        </p>
        <p className="text-xs text-gray-500">
          所有登录活动将被记录用于安全审计
        </p>
      </div>
    </div>
  );
}
