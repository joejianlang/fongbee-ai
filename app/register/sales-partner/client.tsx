'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Building, AlertCircle, CheckCircle } from 'lucide-react';

function SalesPartnerRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get('invitation');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const inputClass =
    'w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all';

  if (!invitationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h1 className="text-xl font-bold text-center text-gray-800 mb-2">无效的邀请链接</h1>
          <p className="text-center text-gray-600 mb-6">
            请使用邀请者发送的完整邀请链接来注册
          </p>
          <button
            onClick={() => router.push('/auth/login/service-provider')}
            className="w-full px-4 py-3 bg-[#0d9488] text-white rounded-lg hover:bg-[#0a7c71] transition-colors font-semibold"
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">注册成功！</h1>
          <p className="text-gray-600 mb-6">
            恭喜！您已成功注册为销售合伙人。
            <br />
            <br />
            首次注册赠送 ￥100 代金券！
          </p>
          <p className="text-sm text-gray-500 mb-6">正在跳转到登录页面...</p>
          <div className="inline-block w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 前端验证
      if (!name || !email || !password || !confirmPassword || !companyName) {
        setError('请填写所有必填项');
        return;
      }

      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }

      if (password.length < 8) {
        setError('密码长度至少8个字符');
        return;
      }

      if (!/[A-Z]/.test(password)) {
        setError('密码必须包含至少一个大写字母');
        return;
      }

      if (!/\d/.test(password)) {
        setError('密码必须包含至少一个数字');
        return;
      }

      // 调用注册 API
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role: 'SALES_PARTNER',
          companyName,
          invitationId,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || '注册失败');
        return;
      }

      setSuccess(true);

      // 3秒后重定向到登录页
      setTimeout(() => {
        router.push('/auth/login/service-provider');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-black text-2xl">优</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">销售合伙人注册</h1>
          <p className="text-gray-600 text-sm mt-1">推荐客户获得佣金</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Bonus Info */}
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-green-800 mb-2">💰 首次注册优惠</p>
            <p className="text-sm text-green-700">
              完成注册后，您将获得 ￥100 代金券用于平台消费！
            </p>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-6">创建账户</h2>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                您的名字 *
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入您的真实名字"
                  className={inputClass + ' pl-10'}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                邮箱地址 *
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={inputClass + ' pl-10'}
                  required
                />
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                公司名称 *
              </label>
              <div className="relative">
                <Building size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="您的公司或团队名称"
                  className={inputClass + ' pl-10'}
                  required
                />
              </div>
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
                  placeholder="至少8个字符，包含大写字母和数字"
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
              <p className="text-xs text-gray-500 mt-1">密码需至少8个字符，包含大写字母和数字</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                确认密码 *
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  className={inputClass + ' pl-10 pr-10'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  注册中...
                </span>
              ) : (
                '完成注册'
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-sm text-gray-600 text-center mt-6">
            已有账户？{' '}
            <a href="/auth/login/service-provider" className="text-[#0d9488] hover:text-[#0a7c71] font-semibold">
              直接登录
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-6 px-2">
          继续表示您同意{' '}
          <a href="/terms" className="text-[#0d9488] hover:underline">
            服务条款
          </a>
          {' '}和{' '}
          <a href="/privacy" className="text-[#0d9488] hover:underline">
            隐私政策
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SalesPartnerRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      }
    >
      <SalesPartnerRegisterContent />
    </Suspense>
  );
}
