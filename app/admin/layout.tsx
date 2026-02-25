'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  List,
  FileText,
  Users,
  BarChart3,
  Settings,
  FormInput,
  Menu,
  X,
} from 'lucide-react';

const menuItems = [
  { href: '/admin', label: '控制台', icon: LayoutDashboard },
  { href: '/admin/orders', label: '订单管理', icon: Package },
  { href: '/admin/custom-requests', label: '定制需求', icon: List },
  { href: '/admin/payment-policies', label: '支付政策', icon: FileText },
  { href: '/admin/form-builder', label: '表单构建器', icon: FormInput },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/finance', label: '财务报表', icon: BarChart3 },
  { href: '/admin/settings', label: '系统设置', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-nav-bg text-nav-text transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-black/10">
          <h1
            className={`font-bold ${
              sidebarOpen ? 'text-xl' : 'text-center text-lg'
            }`}
          >
            {sidebarOpen ? '优服佳' : '优'}
          </h1>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#0d9488] text-white'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-black/10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center py-2 rounded-lg hover:bg-white/10"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
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
            {/* User Menu */}
            <div className="w-10 h-10 rounded-full bg-text-accent flex items-center justify-center text-white font-bold">
              A
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
