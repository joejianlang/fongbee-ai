'use client';

import {
  User,
  LayoutGrid,
  MapPin,
  Clock,
  UserCircle,
  Eye,
  Star,
  RefreshCw,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  // TODO: Fetch real user data from API
  const user = {
    name: '雪王',
    memberLevel: '积分会员',
    points: 100,
  };

  const menuItems = [
    { icon: LayoutGrid, label: '标准服务管理', href: '/dashboard/service-provider/profile/services', color: 'text-[#10b981]' },
    { icon: MapPin, label: '服务区域管理', href: '/dashboard/service-provider/profile/service-areas', color: 'text-red-400' },
    { icon: Clock, label: '服务时间管理', href: '/dashboard/service-provider/profile/service-hours', color: 'text-blue-400' },
    { icon: UserCircle, label: '编辑个人资料', href: '/dashboard/service-provider/profile/edit', color: 'text-[#10b981]' },
    { icon: Eye, label: '预览我的展示主页', href: '/dashboard/service-provider/profile/preview', color: 'text-cyan-400' },
    { icon: Star, label: '收到的评论', href: '/dashboard/service-provider/profile/reviews', color: 'text-yellow-400' },
    { icon: RefreshCw, label: '切换回普通用户', href: '#', color: 'text-orange-400' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/auth/signin';
  };

  return (
    <div className="px-4 pt-6">
      {/* Page Title */}
      <h1 className="text-white text-lg font-bold text-center mb-6">我的</h1>

      {/* Profile Card */}
      <div className="bg-[#1a2332] rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-[#253344] flex items-center justify-center">
            <User size={28} className="text-[#10b981]" />
          </div>
          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-white text-lg font-bold">{user.name}</span>
              <span className="text-[#10b981] text-xs font-medium">{user.memberLevel}</span>
            </div>
            <p className="text-gray-400 text-xs">点击设置资料</p>
          </div>
          {/* Points */}
          <div className="text-right">
            <span className="text-[#10b981] text-2xl font-bold">{user.points}</span>
            <p className="text-gray-400 text-xs">我的积分</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-4 bg-[#1a2332] rounded-2xl px-5 py-4 hover:bg-[#1e2a3a] transition-colors"
            >
              <Icon size={22} className={item.color} />
              <span className="text-gray-200 text-sm flex-1">{item.label}</span>
              <ChevronRight size={18} className="text-gray-600" />
            </Link>
          );
        })}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 bg-[#1a2332] rounded-2xl px-5 py-4 hover:bg-[#2a1a1a] transition-colors w-full"
        >
          <LogOut size={22} className="text-red-400" />
          <span className="text-red-400 text-sm flex-1 text-left">退出登录</span>
          <ChevronRight size={18} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
}
