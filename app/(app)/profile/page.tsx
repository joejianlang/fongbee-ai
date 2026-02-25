'use client';

import {
  User, MapPin, Bell, Shield, FileText,
  ChevronRight, LogOut, Settings, BookOpen,
  Heart, Star,
} from 'lucide-react';
import Link from 'next/link';

const MENU_ITEMS = [
  {
    group: '我的服务',
    items: [
      { icon: FileText,  label: '我的订单',   href: '/orders',    badge: '' },
      { icon: Heart,     label: '我的收藏',   href: '/bookmarks', badge: '' },
      { icon: Star,      label: '我的评价',   href: '/reviews',   badge: '' },
    ],
  },
  {
    group: '账户设置',
    items: [
      { icon: User,    label: '个人信息',   href: '/settings/profile',  badge: '' },
      { icon: MapPin,  label: '地址管理',   href: '/settings/address',  badge: '' },
      { icon: Bell,    label: '通知设置',   href: '/settings/notify',   badge: '3' },
      { icon: Shield,  label: '隐私与安全', href: '/settings/privacy',  badge: '' },
    ],
  },
  {
    group: '帮助',
    items: [
      { icon: BookOpen, label: '使用帮助',   href: '/help',   badge: '' },
      { icon: Settings, label: '关于优服佳', href: '/about',  badge: '' },
    ],
  },
];

export default function ProfilePage() {
  return (
    <div className="pb-6">
      {/* 头部个人信息卡 */}
      <div className="bg-[#0d9488] px-5 py-8 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <User size={32} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-lg">登录 / 注册</p>
          <p className="text-white/70 text-sm mt-0.5">登录后享受完整服务</p>
        </div>
        <Link
          href="/auth/login"
          className="ml-auto bg-white text-[#0d9488] text-sm font-semibold px-4 py-2 rounded-full hover:bg-white/90 transition-colors"
        >
          去登录
        </Link>
      </div>

      {/* 快捷统计 */}
      <div className="bg-white dark:bg-[#2d2d30] mx-3 md:mx-0 mt-3 rounded-xl shadow-sm grid grid-cols-3 divide-x divide-border-primary">
        {[
          { label: '订单', value: '0' },
          { label: '收藏', value: '0' },
          { label: '评价', value: '0' },
        ].map(({ label, value }) => (
          <button key={label} className="flex flex-col items-center py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <span className="text-xl font-bold text-text-primary dark:text-white">{value}</span>
            <span className="text-xs text-text-muted mt-0.5">{label}</span>
          </button>
        ))}
      </div>

      {/* 菜单列表 */}
      <div className="mt-3 space-y-2.5 px-3 md:px-0">
        {MENU_ITEMS.map(({ group, items }) => (
          <div key={group} className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden">
            <p className="text-xs text-text-muted font-medium px-4 pt-3 pb-1.5">{group}</p>
            {items.map(({ icon: Icon, label, href, badge }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-t border-border-primary first:border-0"
              >
                <Icon size={18} className="text-text-secondary flex-shrink-0" />
                <span className="flex-1 text-sm text-text-primary dark:text-white">{label}</span>
                {badge && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {badge}
                  </span>
                )}
                <ChevronRight size={15} className="text-text-muted" />
              </Link>
            ))}
          </div>
        ))}

        {/* 退出登录 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden">
          <button className="w-full flex items-center justify-center gap-2 py-4 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
