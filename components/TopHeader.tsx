'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Newspaper, MessageSquare, Store, User,
  MapPin, Search, Bookmark, Moon, Sun,
  Menu, X, Settings, ChevronDown,
} from 'lucide-react';

const CITY_OPTIONS = ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Guelph'];

interface TopHeaderProps {
  enableEnglish?: boolean;
}

export default function TopHeader({ enableEnglish = true }: TopHeaderProps) {
  const pathname  = usePathname();
  const t         = useTranslations('header');
  const tNav      = useTranslations('nav');
  const locale    = useLocale();
  const { data: session } = useSession();
  const isAdmin   = (session?.user as { role?: string })?.role === 'ADMIN';

  const [dark,    setDark]    = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search,  setSearch]  = useState('');
  const [city,    setCity]    = useState('Guelph');
  const [cityOpen, setCityOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  const NAV_LINKS = [
    { href: '/',         label: tNav('news'),     icon: Newspaper },
    { href: '/forum',    label: tNav('forum'),    icon: MessageSquare },
    { href: '/services', label: tNav('services'), icon: Store },
    { href: '/profile',  label: tNav('profile'),  icon: User },
  ];

  /* ── 初始化深色模式 ── */
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  /* ── 初始化城市 ── */
  useEffect(() => {
    const saved = localStorage.getItem('selectedCity') ?? 'Guelph';
    setCity(saved);
  }, []);

  /* ── 点击外部关闭城市下拉 ── */
  useEffect(() => {
    if (!cityOpen) return;
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [cityOpen]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const selectCity = (c: string) => {
    setCity(c);
    setCityOpen(false);
    localStorage.setItem('selectedCity', c);
    window.dispatchEvent(new CustomEvent('cityChange', { detail: c }));
  };

  const switchLocale = (loc: string) => {
    document.cookie = `locale=${loc};path=/;max-age=31536000`;
    window.location.reload();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d9488] shadow-md">
      {/* ── 跳转到主内容（无障碍） ── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:text-[#0d9488] focus:px-3 focus:py-1 focus:rounded focus:z-50"
      >
        {t('skipToContent')}
      </a>

      <div className="max-w-[1280px] mx-auto px-3 md:px-6 h-14 flex items-center gap-3">

        {/* ── Logo ── */}
        <Link href="/" className="flex-shrink-0 flex items-center gap-1">
          <span className="text-white font-extrabold text-xl tracking-tight leading-none">
            数位 <span className="font-black">Buffet</span>
          </span>
        </Link>

        {/* ── 城市选择器 ── */}
        <div ref={cityRef} className="relative flex-shrink-0">
          <button
            onClick={() => setCityOpen((v) => !v)}
            className="flex items-center gap-1 text-white/90 hover:text-white text-sm px-2 py-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label={t('selectCity')}
            aria-expanded={cityOpen}
          >
            <MapPin size={14} />
            <span className="hidden sm:inline">{city}</span>
            <ChevronDown size={12} className={`transition-transform ${cityOpen ? 'rotate-180' : ''}`} />
          </button>
          {cityOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#2d2d30] rounded-lg shadow-lg py-1 z-50 min-w-[130px]">
              {CITY_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => selectCity(c)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    c === city
                      ? 'text-[#0d9488] font-medium'
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── 语言切换 ── */}
        {enableEnglish && (
          <div className="flex-shrink-0 flex items-center text-xs font-medium text-white/80 gap-0.5">
            {(['zh', 'en'] as const).map((loc) => (
              <button
                key={loc}
                onClick={() => switchLocale(loc)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  locale === loc ? 'text-white bg-white/20' : 'hover:text-white'
                }`}
              >
                {loc === 'zh' ? '中' : 'EN'}
              </button>
            ))}
          </div>
        )}

        {/* ── PC 搜索框 ── */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="hidden md:flex flex-1 max-w-md items-center bg-white/20 rounded-full px-4 py-1.5 gap-2 focus-within:bg-white/30 transition-colors"
        >
          <Search size={14} className="text-white/80 flex-shrink-0" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            aria-label={t('searchLabel')}
            className="flex-1 bg-transparent text-white placeholder-white/70 text-sm outline-none"
          />
        </form>

        {/* ── PC 导航链接 ── */}
        <nav aria-label="主导航" className="hidden md:flex items-center gap-1 ml-2">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 md:flex-none" />

        {/* ── 管理中心（PC，仅 ADMIN 可见） ── */}
        {isAdmin && (
          <Link
            href="/admin"
            className="hidden md:flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs px-3 py-1.5 rounded-full transition-colors"
          >
            <Settings size={13} />
            {t('adminCenter')}
          </Link>
        )}

        {/* ── 书签 ── */}
        <button
          className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label={t('bookmarks')}
        >
          <Bookmark size={18} />
        </button>

        {/* ── 深色模式切换 ── */}
        <button
          onClick={toggleDark}
          className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label={dark ? t('switchLight') : t('switchDark')}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* ── H5 汉堡菜单按钮 ── */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label={t('openMenu')}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── H5 展开菜单 ── */}
      {menuOpen && (
        <nav
          aria-label="移动端菜单"
          className="md:hidden bg-[#0a7c71] border-t border-white/10"
        >
          {/* 搜索框 */}
          <div className="px-4 py-3">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex items-center bg-white/20 rounded-full px-4 py-2 gap-2"
            >
              <Search size={14} className="text-white/80" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('search')}
                aria-label={t('searchLabel')}
                className="flex-1 bg-transparent text-white placeholder-white/70 text-sm outline-none"
              />
            </form>
          </div>
          {/* 导航链接 */}
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-6 py-3 text-white/90 hover:bg-white/10 transition-colors"
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-6 py-3 text-white/90 hover:bg-white/10 transition-colors border-t border-white/10"
            >
              <Settings size={18} />
              <span className="text-sm font-medium">{t('adminCenter')}</span>
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
