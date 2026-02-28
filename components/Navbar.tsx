'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Newspaper, MessageSquare, Store, User } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const navItems = [
    { href: '/',         label: t('news'),     icon: Newspaper },
    { href: '/forum',    label: t('forum'),    icon: MessageSquare },
    { href: '/services', label: t('services'), icon: Store },
    { href: '/profile',  label: t('profile'),  icon: User },
  ];

  // 不在管理页面显示
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-40 pb-safe md:hidden">
      <div className="flex justify-center gap-8 items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 active:scale-95 ${
                isActive ? 'text-text-accent' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon
                size={26}
                className={`mb-1 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-xs tracking-wide ${
                  isActive ? 'font-extrabold' : 'font-bold'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
