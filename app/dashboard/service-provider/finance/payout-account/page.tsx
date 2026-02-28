'use client';

import { useState } from 'react';
import { Landmark, Plus, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
}

// TODO: Fetch from API
const mockAccounts: BankAccount[] = [
  {
    id: '1',
    bankName: 'TD Canada Trust',
    accountNumber: '****4521',
    accountHolder: '雪王',
    isDefault: true,
  },
];

export default function PayoutAccountPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>(mockAccounts);

  return (
    <div>
      <PageHeader
        title="收款账户 (提现)"
        rightElement={
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-[#10b981] text-white">
            <Plus size={18} />
          </button>
        }
      />

      <div className="px-4 space-y-4">
        {/* Security Notice */}
        <div className="flex items-start gap-3 bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl p-4">
          <ShieldCheck size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" />
          <p className="text-gray-300 text-xs leading-relaxed">
            您的银行账户信息经过加密存储，仅用于提现操作，我们不会向第三方透露您的账户信息。
          </p>
        </div>

        {/* Account List */}
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12">
            <div className="w-20 h-20 rounded-full bg-[#1a2332] flex items-center justify-center mb-4">
              <Landmark size={32} className="text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm mb-4">还没有绑定收款账户</p>
            <button className="px-6 py-2.5 bg-[#10b981] text-white rounded-xl text-sm font-medium">
              添加银行账户
            </button>
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="bg-[#1a2332] rounded-2xl px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#253344] flex items-center justify-center">
                  <Landmark size={22} className="text-[#10b981]" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-200 text-sm font-medium">{account.bankName}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    账号：{account.accountNumber} · {account.accountHolder}
                  </p>
                </div>
                {account.isDefault && (
                  <span className="text-xs bg-[#10b981]/20 text-[#10b981] px-2.5 py-1 rounded-full">
                    默认
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
