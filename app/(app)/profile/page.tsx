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
        { icon: FileText,       label: t('myOrders'),     href: '/orders',         badge: '' },
        { icon: ClipboardList,  label: t('customOrders'), href: '/orders/custom',  badge: '' },
        { icon: Heart,          label: t('myBookmarks'),  href: '/bookmarks',      badge: '' },
        { icon: Star,           label: t('myReviews'),    href: '/reviews',        badge: '' },
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
        { icon: BookOpen, label: t('useHelp'), href: '/help',   badge: '' },
        { icon: Settings, label: t('aboutUs'), href: '/about',  badge: '' },
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
          {isLoading ? (
            <div className="space-y-1.5">
              <div className="h-5 w-32 bg-white/30 rounded animate-pulse" />
              <div className="h-3.5 w-48 bg-white/20 rounded animate-pulse" />
            </div>
          ) : isAuthenticated ? (
            <>
              <p className="text-white font-bold text-lg truncate">{fullName || t('user')}</p>
              <p className="text-white/70 text-sm mt-0.5 truncate">{user?.email}</p>
            </>
          ) : (
            <>
              <p className="text-white font-bold text-lg">{t('loginRegister')}</p>
              <p className="text-white/70 text-sm mt-0.5">{t('loginPrompt')}</p>
            </>
          )}
        </div>
        {!isAuthenticated && !isLoading && (
          <Link
            href="/auth/login"
            className="ml-auto bg-white text-[#0d9488] text-sm font-semibold px-4 py-2 rounded-full hover:bg-white/90 transition-colors flex-shrink-0"
          >
            {t('goLogin')}
          </Link>
        )}
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
            href={isAuthenticated ? href : '/auth/login'}
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
                href={isAuthenticated ? href : '/auth/login'}
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

        {/* 退出登录 / 加载状态 */}
        {isAuthenticated ? (
          <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center justify-center gap-2 py-4 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              <LogOut size={16} />
              {t('logout')}
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-4">
            <Loader size={20} className="animate-spin text-[#0d9488]" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
