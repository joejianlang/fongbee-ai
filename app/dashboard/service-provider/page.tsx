'use client';

import { useSession } from 'next-auth/react';
import { User, ClipboardList, LayoutGrid, Mail, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ServiceProviderDashboard() {
  const { data: session } = useSession();
  const sessionUser = session?.user as {
    name?: string; email?: string;
    firstName?: string; lastName?: string;
  } | undefined;

  const displayName = sessionUser?.name
    ?? [sessionUser?.firstName, sessionUser?.lastName].filter(Boolean).join(' ')
    ?? sessionUser?.email?.split('@')[0]
    ?? '服务商';

  const user = {
    name:              displayName,
    memberLevel:       '积分会员',
    points:            100,
    totalIncome:       0,
    pendingSettlement: 0,
    withdrawable:      0,
  };

  const quickActions = [
    { icon: ClipboardList, label: '任务大厅', href: '/dashboard/service-provider/orders' },
    { icon: LayoutGrid, label: '营业统计', href: '/dashboard/service-provider/finance' },
    { icon: Mail, label: '收件箱', href: '/dashboard/service-provider/inbox' },
  ];

  return (
    <div className="px-4 pt-6">
      {/* Page Title */}
      <h1 className="text-white text-lg font-bold text-center mb-6">服务商工作台</h1>

      {/* Profile Card */}
      <div className="bg-[#1a2332] rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-4 mb-4">
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
            <Link href="/dashboard/service-provider/profile" className="text-gray-400 text-xs">
              点击设置资料
            </Link>
          </div>
          {/* Points */}
          <div className="text-right">
            <span className="text-[#10b981] text-2xl font-bold">{user.points}</span>
            <p className="text-gray-400 text-xs">
              我的积分 <ChevronRight size={12} className="inline" />
            </p>
          </div>
        </div>

        {/* Income Stats */}
        <div className="flex border-t border-gray-700 pt-4">
          <div className="flex-1 text-center">
            <p className="text-gray-400 text-xs mb-1">总收入</p>
            <p className="text-white text-lg font-bold">${user.totalIncome}</p>
          </div>
          <div className="w-px bg-gray-700" />
          <div className="flex-1 text-center">
            <p className="text-gray-400 text-xs mb-1">待结算</p>
            <p className="text-white text-lg font-bold">${user.pendingSettlement}</p>
          </div>
          <div className="w-px bg-gray-700" />
          <div className="flex-1 text-center">
            <p className="text-gray-400 text-xs mb-1">可提现</p>
            <p className="text-[#10b981] text-lg font-bold">${user.withdrawable}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-gray-300 text-base font-semibold mb-4">常用功能</h2>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="bg-[#1a2332] rounded-2xl p-5 flex flex-col items-center gap-3 hover:bg-[#1e2a3a] transition-colors"
            >
              <Icon size={32} className="text-[#10b981]" />
              <span className="text-gray-300 text-sm">{action.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Pending Items */}
      <h2 className="text-gray-300 text-base font-semibold mb-4">待办事项</h2>
      <div className="bg-[#1a2332] rounded-2xl p-5 space-y-3">
        <div className="bg-[#2a1a1a] text-[#e8a0a0] text-sm px-4 py-2.5 rounded-lg">
          目前没有待处理订单
        </div>
        <div className="bg-[#2a1f1a] text-[#c8a080] text-sm px-4 py-2.5 rounded-lg">
          没有待确认的报价
        </div>
      </div>
    </div>
  );
}
