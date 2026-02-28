'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreditCard, Plus, ChevronLeft, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiry: string;
  holder: string;
  isDefault: boolean;
}

// TODO: Fetch from API
const mockCards: PaymentMethod[] = [
  { id: '1', type: 'visa', last4: '4521', expiry: '08/26', holder: '严建良', isDefault: true },
  { id: '2', type: 'mastercard', last4: '8830', expiry: '11/25', holder: '严建良', isDefault: false },
];

const cardGradient: Record<PaymentMethod['type'], string> = {
  visa:       'from-[#0d9488] to-[#0a7c71]',
  mastercard: 'from-[#253344] to-[#1a2332]',
  amex:       'from-[#2d3a4a] to-[#1e2a38]',
};

const cardLabel: Record<PaymentMethod['type'], string> = {
  visa: 'VISA',
  mastercard: 'Mastercard',
  amex: 'Amex',
};

export default function PaymentPage() {
  const router = useRouter();
  const t = useTranslations('payment');
  const tSettings = useTranslations('settings');
  const [cards, setCards] = useState<PaymentMethod[]>(mockCards);

  const setDefault = (id: string) => {
    setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
  };

  const removeCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1724]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a2332] px-4 pt-12 pb-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          <ChevronLeft size={22} className="text-gray-700 dark:text-white" />
        </button>
        <h1 className="flex-1 text-base font-bold text-gray-900 dark:text-white">{tSettings('paymentTitle')}</h1>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Cards */}
        <div className="space-y-3">
          {cards.map((card) => (
            <div key={card.id} className={`relative rounded-2xl bg-gradient-to-br ${cardGradient[card.type]} p-5 overflow-hidden`}>
              {/* Background decoration */}
              <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/5" />
              <div className="absolute -right-2 top-8 w-20 h-20 rounded-full bg-white/5" />

              {/* Card type */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-white/80 text-xs font-semibold tracking-widest">{cardLabel[card.type]}</span>
                {card.isDefault && (
                  <span className="flex items-center gap-1 bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">
                    <CheckCircle2 size={11} />
                    {t('default')}
                  </span>
                )}
              </div>

              {/* Card number */}
              <p className="text-white text-base font-mono tracking-widest mb-4">
                •••• •••• •••• {card.last4}
              </p>

              {/* Card details */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white/50 text-xs mb-0.5">{t('cardholder')}</p>
                  <p className="text-white text-sm font-medium">{card.holder}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-xs mb-0.5">{t('expiry')}</p>
                  <p className="text-white text-sm font-medium">{card.expiry}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                {!card.isDefault && (
                  <button
                    onClick={() => setDefault(card.id)}
                    className="flex-1 bg-white/15 text-white text-xs font-medium py-2 rounded-xl hover:bg-white/25 transition-colors"
                  >
                    {t('setDefault')}
                  </button>
                )}
                <button
                  onClick={() => removeCard(card.id)}
                  className="flex items-center justify-center gap-1.5 bg-red-500/20 text-red-300 text-xs font-medium px-4 py-2 rounded-xl hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 size={13} />
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Card */}
        <button className="w-full flex items-center justify-center gap-2 bg-white dark:bg-[#1a2332] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl py-4 text-[#0d9488] text-sm font-medium hover:border-[#0d9488] hover:bg-[#0d9488]/5 transition-all">
          <Plus size={18} />
          {t('addCard')}
        </button>

        {/* Security Notice */}
        <div className="flex items-start gap-3 bg-[#0d9488]/10 border border-[#0d9488]/20 rounded-2xl p-4">
          <ShieldCheck size={18} className="text-[#0d9488] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-800 dark:text-gray-200 text-sm font-medium mb-1">{t('securityTitle')}</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              {t('securityDesc')}
            </p>
          </div>
        </div>

        {/* Payment History */}
        <div>
          <p className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-3">{t('recentTx')}</p>
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden shadow-sm">
            {[
              { label: '家庭清洁服务', date: '2024-01-20', amount: '-$160', color: 'text-gray-900 dark:text-white' },
              { label: '水管维修', date: '2024-01-15', amount: '-$240', color: 'text-gray-900 dark:text-white' },
              { label: '退款 - 取消订单', date: '2024-01-10', amount: '+$80', color: 'text-[#0d9488]' },
            ].map((tx, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-gray-800 dark:text-gray-200 text-sm">{tx.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{tx.date}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.color}`}>{tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
