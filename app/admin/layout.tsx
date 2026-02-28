'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Package,
  List,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  LucideIcon,
} from 'lucide-react';

interface MenuItem {
  href?: string;
  label: string;
  icon: LucideIcon;
  children?: Array<{ href: string; label: string }>;
}

const menuItems: MenuItem[] = [
  { href: '/admin', label: '控制台', icon: LayoutDashboard },

  // 标准服务管理
  {
    label: '标准服务管理',
    icon: Package,
    children: [
      { href: '/admin/standard-orders', label: '订单管理' },
      { href: '/admin/payment-policies', label: '支付政策' },
    ],
  },

  // 定制服务管理
  {
    label: '定制服务管理',
    icon: List,
    children: [
      { href: '/admin/custom-orders', label: '订单管理' },
      { href: '/admin/custom-requests', label: '定制需求' },
      { href: '/admin/form-builder', label: '表单构建器' },
    ],
  },

  // 用户管理
  {
    label: '用户管理',
    icon: Users,
    children: [
      { href: '/admin/users/sales-partners', label: '邀请链接' },
      { href: '/admin/users', label: '用户列表' },
      { href: '/admin/users/subscriptions', label: '订阅记录' },
      { href: '/admin/users/invitations', label: '销售合伙人列表' },
      { href: '/admin/users/providers', label: '服务商列表' },
    ],
  },

  // 财务报表
  { href: '/admin/finance', label: '财务报表', icon: BarChart3 },

  // 系统管理
  {
    label: '系统管理',
    icon: Settings,
    children: [
      { href: '/admin/articles', label: '内容管理' },
      { href: '/admin/service-categories', label: '服务分类' },
      { href: '/admin/email-templates', label: '邮件模板' },
      { href: '/admin/sms-templates', label: '短信模板' },
      { href: '/admin/settings', label: 'AI 全局系统设置' },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session, status } = useSession();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 非 ADMIN 角色一律跳回首页
  useEffect(() => {
    if (status === 'loading') return;
    const role = (session?.user as { role?: string })?.role;
    if (status === 'unauthenticated' || role !== 'ADMIN') {
      router.replace('/');
    }
  }, [status, session, router]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const isMenuActive = (item: MenuItem): boolean => {
    if (item.href) {
      return pathname === item.href;
    }
    if (item.children) {
      return item.children.some((child) => pathname === child.href);
    }
    return false;
  };

  // 未加载完或非 ADMIN 时不渲染内容，避免页面闪烁
  const role = (session?.user as { role?: string })?.role;
  if (status === 'loading' || role !== 'ADMIN') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-nav text-nav-text transition-all duration-300 flex flex-col flex-shrink-0 border-r border-white/10`}
      >
        {/* Logo */}
        <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <h1
            className={`font-bold whitespace-nowrap overflow-hidden text-ellipsis text-white ${
              isCollapsed ? 'text-sm' : 'text-sm'
            }`}
          >
            {isCollapsed ? '优' : '优服佳 / 后台'}
          </h1>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = isMenuActive(item);
            const isExpanded = expandedMenu === item.label;
            const hasChildren = !!item.children;

            return (
              <div key={`${item.label}-${idx}`}>
                {hasChildren ? (
                  // Menu group
                  <div>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                        isActive
                          ? 'bg-[rgba(13,148,136,0.18)] text-white border-r-[3px] border-[#0d9488]'
                          : 'text-white hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon size={20} className="flex-shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronDown
                            size={16}
                            className={`transition-transform flex-shrink-0 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </>
                      )}
                    </button>
                    {/* Submenu */}
                    {isExpanded && !isCollapsed && item.children && (
                      <div className="bg-black/12 ml-0 mt-1 rounded-lg overflow-hidden">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href || '#'}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              pathname === child.href
                                ? 'bg-[rgba(13,148,136,0.18)] text-white font-medium'
                                : 'text-white hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <span>{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Direct link
                  <Link
                    href={item.href || '#'}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                      isActive
                        ? 'bg-[rgba(13,148,136,0.18)] text-white border-r-[3px] border-[#0d9488]'
                        : 'text-white hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-white/10 flex-shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center py-2.5 rounded-lg text-white hover:bg-white/10 transition-colors"
            title={isCollapsed ? '展开菜单' : '折叠菜单'}
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-card-border px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">管理控制台</h2>
            <p className="text-sm text-text-muted">欢迎回来，管理员</p>
          </div>
          <div className="flex items-center gap-4">
            {/* User Menu Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#0d9488] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(session?.user?.name ?? session?.user?.email ?? 'A')[0].toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium text-text-primary leading-tight max-w-[120px] truncate">
                    {session?.user?.name || session?.user?.email || '管理员'}
                  </p>
                  <p className="text-[10px] text-text-muted leading-tight">管理员</p>
                </div>
                <ChevronDown size={14} className={`text-text-muted transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-card-border rounded-xl shadow-lg z-50 overflow-hidden">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-card-border">
                    <p className="text-xs font-semibold text-text-primary truncate">
                      {session?.user?.name || '管理员'}
                    </p>
                    <p className="text-xs text-text-muted truncate mt-0.5">
                      {session?.user?.email || ''}
                    </p>
                  </div>
                  {/* Logout */}
                  <button
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <LogOut size={16} />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
