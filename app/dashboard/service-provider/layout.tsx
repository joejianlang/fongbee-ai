'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  ClipboardList,
  Wallet,
  User,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard/service-provider', label: '工作台', icon: LayoutGrid },
  { href: '/dashboard/service-provider/orders', label: '订单', icon: ClipboardList },
  { href: '/dashboard/service-provider/finance', label: '财务', icon: Wallet },
  { href: '/dashboard/service-provider/profile', label: '我的', icon: User },
];

export default function ServiceProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0f1724] flex flex-col">
      {/* Main Content */}
      <main className="flex-1 pb-20 max-w-md mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0f1724] border-t border-gray-800 z-50">
        <div className="max-w-md mx-auto flex">
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard/service-provider'
                ? pathname === '/dashboard/service-provider'
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-3 text-xs transition-colors ${
                  isActive ? 'text-[#10b981]' : 'text-gray-500'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
