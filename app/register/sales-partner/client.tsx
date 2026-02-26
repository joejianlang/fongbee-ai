'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Building, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

function SalesPartnerRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get('invitation');
  const referralCode = searchParams.get('referral');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    businessPhone: '',
  });

  // 验证邀请有效性
  const validateInvitation = async () => {
    if (!invitationId) {
      setError('无效的邀请链接');
      return false;
    }

    try {
      const res = await fetch(`/api/sales-partners/invitations/${invitationId}/validate`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || '邀请无效或已过期');
        return false;
      }

      // 预填充邀请中的信息
      if (data.data.inviteeEmail) {
        setFormData((prev) => ({ ...prev, email: data.data.inviteeEmail }));
      }
      if (data.data.inviteeName) {
        const nameParts = data.data.inviteeName.split(' ');
        setFormData((prev) => ({
          ...prev,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
        }));
      }

      return true;
    } catch (err) {
      setError('验证邀请失败，请重试');
      return false;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. 注册用户
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      const registerData = await registerRes.json();

      if (!registerData.success) {
        setError(registerData.error || '注册失败');
        return;
      }

      const userId = registerData.data.id;

      // 2. 创建销售合伙人账户
      const partnerRes = await fetch('/api/sales-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          companyName: formData.companyName,
          businessPhone: formData.businessPhone,
          invitationId,
        }),
      });

      const partnerData = await partnerRes.json();

      if (!partnerData.success) {
        setError(partnerData.error || '创建销售合伙人账户失败');
        return;
      }

      // 3. 接受邀请
      const acceptRes = await fetch(
        `/api/sales-partners/invitations/${invitationId}/accept`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }
      );

      const acceptData = await acceptRes.json();

      if (!acceptData.success) {
        setError(acceptData.error || '接受邀请失败');
        return;
      }

      setSuccess(true);

      // 注册成功后，重定向到登录页面
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!invitationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h1 className="text-xl font-bold text-center text-gray-800 mb-2">无效的邀请链接</h1>
          <p className="text-center text-gray-600 mb-6">
            请使用管理员发送的完整邀请链接来注册
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0a7c71] transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">注册成功！</h1>
          <p className="text-gray-600 mb-6">
            恭喜！你已成功注册为销售合伙人。
            <br />
            <br />
            正在跳转到登录页面...
          </p>
        </div>
      </div>
    );
  }

  const inputClass =
    'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488]/40 focus:border-transparent outline-none';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">销售合伙人注册</h1>
            <p className="text-gray-600">完成注册后成为优服佳销售合伙人</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱地址</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488]/40 focus:border-transparent outline-none"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488]/40 focus:border-transparent outline-none"
                  placeholder="至少8个字符"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  placeholder="李"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="明"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
              <div className="relative">
                <Building className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488]/40 focus:border-transparent outline-none"
                  placeholder="你的公司名称"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, companyName: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公司电话</label>
              <input
                type="tel"
                className={inputClass}
                placeholder="+1 (555) 000-0000"
                value={formData.businessPhone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, businessPhone: e.target.value }))
                }
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-[#0d9488] text-white font-medium rounded-lg hover:bg-[#0a7c71] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? '注册中...' : '完成注册'}
            </button>
          </form>

          {/* Referral Code Display */}
          {referralCode && (
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600">
                <strong>邀请码:</strong> {referralCode}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            已有账户？{' '}
            <a href="/auth/login/sales-partner" className="text-[#0d9488] hover:underline font-medium">
              登录
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalesPartnerRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <SalesPartnerRegisterContent />
    </Suspense>
  );
}
