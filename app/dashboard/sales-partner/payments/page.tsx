'use client';

import { Landmark, ShieldCheck, Plus, ArrowUpRight } from 'lucide-react';

interface WithdrawalRecord {
  id: string;
  amount: number;
  date: string;
  status: '已到账' | '处理中' | '失败';
  account: string;
}

// TODO: Fetch from API
const mockWithdrawals: WithdrawalRecord[] = [
  { id: '1', amount: 200, date: '2024-01-20', status: '已到账', account: 'TD ****4521' },
  { id: '2', amount: 150, date: '2024-01-05', status: '已到账', account: 'TD ****4521' },
  { id: '3', amount: 80, date: '2023-12-20', status: '已到账', account: 'TD ****4521' },
];

const statusStyle = {
  '已到账': 'text-[#0d9488]',
  '处理中': 'text-yellow-400',
  '失败': 'text-red-400',
};

export default function PaymentsPage() {
  const withdrawable = 335;

  return (
    <div className="px-4 py-5 space-y-4">
      {/* Balance Card */}
      <div className="bg-[#1a2332] rounded-2xl p-5">
        <p className="text-gray-400 text-sm mb-2">可提现余额</p>
        <div className="flex items-center justify-between">
          <span className="text-white text-3xl font-bold">${withdrawable}</span>
          <button className="bg-[#0d9488] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0a7c71] transition-colors">
            提现
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-3">通常1-3个工作日到账</p>
      </div>

      {/* Bank Account */}
      <div className="bg-[#1a2332] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-200 text-sm font-semibold">收款账户</p>
          <button className="flex items-center gap-1 text-[#0d9488] text-xs">
            <Plus size={14} />
            添加账户
          </button>
        </div>
        <div className="flex items-center gap-4 bg-[#253344] rounded-xl px-4 py-3">
          <div className="w-10 h-10 rounded-xl bg-[#1a2332] flex items-center justify-center">
            <Landmark size={18} className="text-[#0d9488]" />
          </div>
          <div className="flex-1">
            <p className="text-gray-200 text-sm font-medium">TD Canada Trust</p>
            <p className="text-gray-500 text-xs">账号 ****4521 · 严建良</p>
          </div>
          <span className="text-xs bg-[#0d9488]/20 text-[#0d9488] px-2.5 py-1 rounded-full">默认</span>
        </div>
        <div className="flex items-start gap-3 mt-3 bg-[#0d9488]/10 border border-[#0d9488]/20 rounded-xl p-3">
          <ShieldCheck size={16} className="text-[#0d9488] flex-shrink-0 mt-0.5" />
          <p className="text-gray-400 text-xs leading-relaxed">您的银行账户信息经过加密存储，仅用于提现操作。</p>
        </div>
      </div>

      {/* Withdrawal History */}
      <div>
        <p className="text-gray-300 text-sm font-semibold mb-3">提现记录</p>
        <div className="space-y-3">
          {mockWithdrawals.map((w) => (
            <div key={w.id} className="flex items-center bg-[#1a2332] rounded-2xl px-5 py-4 gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-400/15 flex items-center justify-center flex-shrink-0">
                <ArrowUpRight size={18} className="text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-gray-200 text-sm">提现到 {w.account}</p>
                <p className="text-gray-500 text-xs mt-0.5">{w.date}</p>
              </div>
              <div className="text-right">
                <p className="text-orange-400 text-sm font-bold">-${w.amount}</p>
                <p className={`text-xs mt-0.5 ${statusStyle[w.status]}`}>{w.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
