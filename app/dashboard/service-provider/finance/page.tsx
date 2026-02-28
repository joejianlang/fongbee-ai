'use client';

import {
  FileText,
  HelpCircle,
  CreditCard,
  FileCheck,
  Star,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

export default function FinancePage() {
  // TODO: Fetch real finance data from API
  const finance = {
    withdrawable: 3200,
    monthlyIncome: 1850,
    pendingSettlement: 650,
    totalIncome: 12500,
  };

  const menuItems = [
    { icon: FileText, label: '交易记录', href: '/dashboard/service-provider/finance/transactions', color: 'text-[#10b981]' },
    { icon: HelpCircle, label: '已开具发票', href: '/dashboard/service-provider/finance/invoices', color: 'text-blue-400' },
    { icon: HelpCircle, label: '收款账户 (提现)', href: '/dashboard/service-provider/finance/payout-account', color: 'text-purple-400' },
    { icon: CreditCard, label: '支付方式 (充值)', href: '/dashboard/service-provider/finance/payment-methods', color: 'text-cyan-400' },
    { icon: FileCheck, label: '合同管理', href: '/dashboard/service-provider/finance/contracts', color: 'text-orange-400' },
    { icon: Star, label: '积分订阅', href: '/dashboard/service-provider/finance/points', color: 'text-orange-400' },
  ];

  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="px-4 pt-6">
      {/* Page Title */}
      <h1 className="text-white text-lg font-bold text-center mb-6">财务管理</h1>

      {/* Balance Card */}
      <div className="bg-[#1a2332] rounded-2xl p-5 mb-4">
        <p className="text-gray-400 text-sm mb-2">可提现余额</p>
        <div className="flex items-center justify-between">
          <span className="text-white text-3xl font-bold">
            ${finance.withdrawable.toLocaleString()}
          </span>
          <button className="bg-[#10b981] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0ea572] transition-colors">
            提现
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#1a2332] rounded-2xl p-4 text-center">
          <p className="text-gray-400 text-xs mb-2">本月收入</p>
          <p className="text-[#10b981] text-xl font-bold">
            ${finance.monthlyIncome.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#1a2332] rounded-2xl p-4 text-center">
          <p className="text-gray-400 text-xs mb-2">待结算</p>
          <p className="text-orange-400 text-xl font-bold">
            ${finance.pendingSettlement.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#1a2332] rounded-2xl p-4 text-center">
          <p className="text-gray-400 text-xs mb-2">累计收入</p>
          <p className="text-white text-xl font-bold">
            {formatAmount(finance.totalIncome)}
          </p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-4 bg-[#1a2332] rounded-2xl px-5 py-4 hover:bg-[#1e2a3a] transition-colors"
            >
              <Icon size={22} className={item.color} />
              <span className="text-gray-200 text-sm flex-1">{item.label}</span>
              <ChevronRight size={18} className="text-gray-600" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
