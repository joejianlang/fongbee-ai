'use client';

import { CreditCard, Plus, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'interac';
  last4: string;
  expiry: string;
  isDefault: boolean;
}

// TODO: Fetch from API
const mockCards: PaymentMethod[] = [
  { id: '1', type: 'visa', last4: '4242', expiry: '12/26', isDefault: true },
];

const cardTypeLabel = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  interac: 'Interac e-Transfer',
};

const cardTypeBg = {
  visa: 'from-blue-700 to-blue-500',
  mastercard: 'from-red-700 to-orange-500',
  interac: 'from-[#10b981] to-[#0a7c71]',
};

export default function PaymentMethodsPage() {
  return (
    <div>
      <PageHeader
        title="支付方式 (充值)"
        rightElement={
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-[#10b981] text-white">
            <Plus size={18} />
          </button>
        }
      />

      <div className="px-4 space-y-4">
        {/* Info Notice */}
        <div className="flex items-start gap-3 bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl p-4">
          <ShieldCheck size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" />
          <p className="text-gray-300 text-xs leading-relaxed">
            充值功能用于购买积分订阅或其他增值服务，提现请使用"收款账户"。
          </p>
        </div>

        {/* Card List */}
        {mockCards.map((card) => (
          <div
            key={card.id}
            className={`bg-gradient-to-br ${cardTypeBg[card.type]} rounded-2xl p-5`}
          >
            <div className="flex items-start justify-between mb-6">
              <CreditCard size={24} className="text-white/80" />
              {card.isDefault && (
                <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full">
                  默认
                </span>
              )}
            </div>
            <p className="text-white font-mono text-lg tracking-widest mb-4">
              **** **** **** {card.last4}
            </p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/60 text-xs">有效期</p>
                <p className="text-white text-sm font-medium">{card.expiry}</p>
              </div>
              <p className="text-white font-bold text-lg">{cardTypeLabel[card.type]}</p>
            </div>
          </div>
        ))}

        {/* Add New */}
        <button className="w-full flex items-center justify-center gap-3 border-2 border-dashed border-gray-600 rounded-2xl py-5 text-gray-400 hover:border-[#10b981] hover:text-[#10b981] transition-colors">
          <Plus size={20} />
          <span className="text-sm">添加支付方式</span>
        </button>
      </div>
    </div>
  );
}
