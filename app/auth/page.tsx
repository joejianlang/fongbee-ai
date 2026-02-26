'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Briefcase, Users, Shield } from 'lucide-react';

export default function AuthRoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<'service-provider' | 'sales-partner' | 'admin' | null>(null);

  const roles = [
    {
      id: 'service-provider',
      name: '服务商',
      description: '提供各类服务的专业人士',
      icon: Briefcase,
      color: 'from-blue-500 to-cyan-500',
      href: '/auth/login/service-provider',
    },
    {
      id: 'sales-partner',
      name: '销售合伙人',
      description: '通过推荐客户获得佣金的合伙人',
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      href: '/auth/login/sales-partner',
    },
    {
      id: 'admin',
      name: '网站管理员',
      description: '平台管理员，负责平台运营',
      icon: Shield,
      color: 'from-purple-500 to-pink-500',
      href: '/auth/login/admin',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-12">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0d9488] to-[#0a7c71] flex items-center justify-center mb-6 shadow-xl">
              <span className="text-white font-black text-4xl">优</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">优服佳</h1>
            <p className="text-gray-600 text-lg">您身边的服务专家</p>
          </div>

          {/* Title */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">选择您的身份</h2>
            <p className="text-gray-600 text-lg">请选择您的角色以继续登录或注册</p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {roles.map((role) => {
              const IconComponent = role.icon;
              return (
                <Link
                  key={role.id}
                  href={role.href}
                  className="group"
                >
                  <div
                    className={`h-full bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 flex flex-col items-center text-center cursor-pointer transform hover:-translate-y-2 border-2 border-transparent hover:border-[#0d9488]`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <IconComponent size={32} />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{role.name}</h3>
                    <p className="text-gray-600 text-sm flex-1 mb-6">{role.description}</p>

                    {/* Arrow */}
                    <div className="flex items-center gap-2 text-[#0d9488] font-semibold group-hover:gap-3 transition-all">
                      <span>开始</span>
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Info Box */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#0d9488]">
            <h3 className="font-semibold text-gray-800 mb-3">💡 您是第一次加入？</h3>
            <p className="text-gray-600 text-sm mb-4">
              如果您还没有账户，可以在选择身份后点击「注册」进行注册。所有类型账户都可以无需邀请码自由注册（销售合伙人需要邀请）。
            </p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">服务商</p>
                <p className="text-gray-800 font-semibold">自由注册</p>
              </div>
              <div>
                <p className="text-gray-500">销售合伙人</p>
                <p className="text-gray-800 font-semibold">需邀请</p>
              </div>
              <div>
                <p className="text-gray-500">管理员</p>
                <p className="text-gray-800 font-semibold">邀请制</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-6 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-gray-600">
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-[#0d9488] transition-colors">
              关于我们
            </Link>
            <Link href="/contact" className="hover:text-[#0d9488] transition-colors">
              联系我们
            </Link>
            <Link href="/terms" className="hover:text-[#0d9488] transition-colors">
              服务条款
            </Link>
            <Link href="/privacy" className="hover:text-[#0d9488] transition-colors">
              隐私政策
            </Link>
          </div>
          <p>© 2024 优服佳. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
