'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from 'lucide-react';

const tabs = [
  { label: '总览', href: '/dashboard/sales-partner' },
  { label: '服务商', href: '/dashboard/sales-partner/providers' },
  { label: '收益', href: '/dashboard/sales-partner/earnings' },
  { label: '收款', href: '/dashboard/sales-partner/payments' },
  { label: '工单', href: '/dashboard/sales-partner/tickets' },
];

// TODO: Replace with real user data from auth context
const mockUser = {
  name: '严建良',
  email: 'joejianlang@gmail.com',
  initial: '严',
};

export default function SalesPartnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/auth/signin');
  };

  return (
    <div className="min-h-screen bg-[#0f1724] flex flex-col">
      {/* Header */}
      <div className="bg-[#1a2332] pt-10 pb-5 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-white text-lg font-bold">销售合伙人</h1>
            <button
              onClick={handleLogout}
              className="bg-[#253344] text-gray-300 text-xs px-3 py-1.5 rounded-full hover:bg-[#2e3d52] transition-colors"
            >
              退出
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#253344] flex items-center justify-center flex-shrink-0">
              <span className="text-[#0d9488] text-xl font-bold">{mockUser.initial}</span>
            </div>
            <div>
              <p className="text-white text-lg font-bold">{mockUser.name}</p>
              <p className="text-gray-400 text-sm">{mockUser.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-[#1a2332] border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-md mx-auto flex">
          {tabs.map((tab) => {
            const isActive =
              tab.href === '/dashboard/sales-partner'
                ? pathname === '/dashboard/sales-partner'
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 py-3.5 text-center text-sm font-medium transition-all border-b-2 ${
                  isActive
                    ? 'text-[#0d9488] border-[#0d9488]'
                    : 'text-gray-400 border-transparent hover:text-gray-200'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-md mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
