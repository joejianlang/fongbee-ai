'use client';

import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
  User, MapPin, Bell, Shield, FileText,
  ChevronRight, LogOut, Settings, BookOpen,
  Heart, Star, ClipboardList, CreditCard, Loader,
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const t = useTranslations('profile');

  const MENU_ITEMS = [
    {
      group: t('myServices'),
      items: [
        { icon: FileText,       label: t('myOrders'),     href: '/orders' },
        { icon: ClipboardList,  label: t('customOrders'), href: '/orders/custom' },
        { icon: Heart,          label: t('myBookmarks'),  href: '/bookmarks' },
        { icon: Star,           label: t('myReviews'),    href: '/reviews' },
      ],
    },
    {
      group: t('accountSettings'),
      items: [
        { icon: User,       label: t('profileInfo'),    href: '/settings/profile',  badge: '' },
        { icon: CreditCard, label: t('paymentInfo'),    href: '/settings/payment',  badge: '' },
        { icon: MapPin,     label: t('addressMgmt'),    href: '/settings/address',  badge: '' },
        { icon: Bell,       label: t('notifySettings'), href: '/settings/notify',   badge: '3' },
        { icon: Shield,     label: t('privacySecurity'),href: '/settings/privacy',  badge: '' },
      ],
    },
    {
      group: t('help'),
      items: [
        { icon: BookOpen, label: t('useHelp'), href: '/help',  badge: '' },
        { icon: Settings, label: t('aboutUs'), href: '/about', badge: '' },
      ],
    },
  ];

  const isLoading       = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  const user     = session?.user as { name?: string; email?: string; firstName?: string; lastName?: string; image?: string } | undefined;
  const fullName = user?.name
    ?? [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    ?? user?.email?.split('@')[0]
    ?? '';

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Loader size={24} className="animate-spin text-[#0d9488]" />
      </div>
    );
  }

  /* ── Guest / Not authenticated ── */
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col pb-6">
        {/* 登录 / 注册 按钮 */}
        <div className="px-4 pt-6 flex gap-3">
          <Link
            href="/auth/login"
            className="flex-1 py-3 rounded-xl border-2 border-[#0d9488] text-[#0d9488] font-semibold text-sm text-center transition-colors hover:bg-[#0d9488]/5"
          >
            {t('goLogin')}
          </Link>
          <Link
            href="/auth/register"
            className="flex-1 py-3 rounded-xl border-2 border-[#0d9488] bg-[#0d9488] text-white font-semibold text-sm text-center transition-colors hover:bg-[#0a7c71]"
          >
            {t('register')}
          </Link>
        </div>

        {/* 空态占位 */}
        <div className="flex flex-col items-center justify-center gap-4 mt-20 px-8">
          <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
            <User size={48} className="text-gray-300 dark:text-white/20" />
          </div>
          <p className="text-text-primary dark:text-white font-semibold text-lg text-center">
            {t('loginToViewCenter')}
          </p>
          <Link
            href="/auth/login"
            className="mt-1 px-10 py-3 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0a7c71] transition-colors text-sm"
          >
            {t('loginNow')}
          </Link>
        </div>
      </div>
    );
  }

  /* ── Authenticated ── */
  return (
    <div className="pb-6">
      {/* 头部个人信息卡 */}
      <div className="bg-[#0d9488] px-5 py-8 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={32} className="text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-lg truncate">{fullName || t('user')}</p>
          <p className="text-white/70 text-sm mt-0.5 truncate">{user?.email}</p>
        </div>
      </div>

      {/* 快捷统计 */}
      <div className="bg-white dark:bg-[#2d2d30] mx-3 md:mx-0 mt-3 rounded-xl shadow-sm grid grid-cols-3 divide-x divide-border-primary">
        {[
          { label: t('orders'),    value: '0', href: '/orders' },
          { label: t('bookmarks'), value: '0', href: '/bookmarks' },
          { label: t('reviews'),   value: '0', href: '/reviews' },
        ].map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <span className="text-xl font-bold text-text-primary dark:text-white">{value}</span>
            <span className="text-sm text-text-muted mt-0.5">{label}</span>
          </Link>
        ))}
      </div>

      {/* 菜单列表 */}
      <div className="mt-3 space-y-2.5 px-3 md:px-0">
        {MENU_ITEMS.map(({ group, items }) => (
          <div key={group} className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden">
            <p className="text-sm text-text-muted font-medium px-4 pt-3 pb-1.5">{group}</p>
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
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-2 py-4 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <LogOut size={16} />
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
