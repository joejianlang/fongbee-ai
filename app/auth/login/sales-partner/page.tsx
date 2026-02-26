'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, Gift } from 'lucide-react';

export default function SalesPartnerLoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [invitationCode, setInvitationCode] = useState('');

  const inputClass =
    'w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        if (!email || !password) {
          setError('请输入邮箱和密码');
          return;
        }
        console.log('Sales Partner Login:', { email, password });
      } else {
        if (!email || !password || !confirmPassword || !name) {
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
        console.log('Sales Partner Register:', { email, password, name, invitationCode });
      }

      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col">
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 shadow-lg">
              <Users size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">销售合伙人</h1>
            <p className="text-gray-600 text-sm mt-1">推荐客户获得佣金</p>
          </div>

          {/* Tab Switch */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                isLogin
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                !isLogin
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              注册
            </button>
          </div>

          {/* Bonus Info */}
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Gift size={18} className="text-green-600" />
              <p className="font-semibold text-green-800">💰 推荐奖励计划</p>
            </div>
            <p className="text-sm text-green-700">
              每推荐一个服务商或客户，您都可以获得相应佣金。首次注册额外赠送￥100代金券！
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (Register Only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  您的名字 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入您的真实名字"
                  className={inputClass}
                  required
                />
              </div>
            )}

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
                  placeholder={isLogin ? '输入密码' : '至少8个字符'}
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

            {/* Confirm Password (Register Only) */}
            {!isLogin && (
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
                    required={!isLogin}
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
            )}

            {/* Invitation Code (Register Only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  邀请码 <span className="text-gray-500 font-normal">(可选)</span>
                </label>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  placeholder="如有邀请码，请输入"
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 mt-1">
                  输入现有合伙人的邀请码可额外获得奖励
                </p>
              </div>
            )}

            {/* Forgot Password (Login Only) */}
            {isLogin && (
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
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  处理中...
                </span>
              ) : isLogin ? (
                '登录'
              ) : (
                '注册并登录'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-xs text-gray-500">或</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* Third Party Login */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center gap-3 py-3 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <span className="text-lg">🍎</span>
              Apple 登录
            </button>
            <button className="w-full flex items-center justify-center gap-3 py-3 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <span className="text-lg">📧</span>
              邮箱登录
            </button>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-600 text-center mt-6">
            {isLogin ? '没有账户？' : '已有账户？'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-[#0d9488] hover:text-[#0a7c71] font-semibold transition-colors"
            >
              {isLogin ? '注册' : '登录'}
            </button>
          </p>

          <p className="text-xs text-gray-500 text-center mt-4 px-2">
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
      <div className="px-4 py-4 bg-white border-t border-gray-200 text-center">
        <p className="text-xs text-gray-600">
          需要帮助？
          <Link href="/contact" className="text-[#0d9488] hover:underline ml-1">
            联系我们
          </Link>
        </p>
      </div>
    </div>
  );
}

import { Users } from 'lucide-react';
