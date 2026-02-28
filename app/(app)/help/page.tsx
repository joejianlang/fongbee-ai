'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ChevronDown, ChevronUp, Search, MessageCircle } from 'lucide-react';

const FAQ = [
  {
    category: '下单与预约',
    items: [
      { q: '如何预约服务？', a: '在"服务"页面找到您需要的服务，点击进入详情页，选择套餐、日期和时间，填写上门地址后点击"确认预约"即可。' },
      { q: '预约后可以修改时间吗？', a: '在"我的订单"中找到对应订单，进入详情后可联系服务商协商修改时间。请至少提前 24 小时修改。' },
      { q: '我的订单一直显示"待确认"怎么办？', a: '服务商通常在 2 小时内确认。如超过 4 小时未确认，请通过订单页面联系服务商，或联系客服。' },
    ],
  },
  {
    category: '支付与退款',
    items: [
      { q: '支持哪些支付方式？', a: '目前支持 Visa、Mastercard 信用卡/借记卡，以及 Apple Pay。我们通过 Stripe 处理所有支付，安全有保障。' },
      { q: '取消订单能退款吗？', a: '服务前 48 小时以上取消：全额退款。24–48 小时取消：退还 80%。24 小时内取消：退还 50%。' },
      { q: '什么时候会扣款？', a: '预约确认后立即授权，服务前 48 小时正式扣款。若服务取消则按退款政策处理。' },
    ],
  },
  {
    category: '关于服务商',
    items: [
      { q: '平台如何审核服务商？', a: '所有服务商均需提供身份证明、相关资质证书，并通过背景调查。带有蓝色认证标志的服务商已完成全部审核。' },
      { q: '服务质量不满意怎么办？', a: '服务完成后可在订单页面提交评价和投诉。客服团队会在 24 小时内跟进处理，必要时提供退款。' },
    ],
  },
];

export default function HelpPage() {
  const t = useTranslations('help');
  const tCommon = useTranslations('common');
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = FAQ.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) => !search || item.q.includes(search) || item.a.includes(search)
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="pb-6">
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors">
          <ArrowLeft size={18} />{tCommon('back')}
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">{t('title')}</span>
      </div>

      {/* 搜索 */}
      <div className="px-4 md:px-0 mt-4">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#2d2d30] border border-border-primary rounded-xl px-4 py-2.5">
          <Search size={15} className="text-text-muted flex-shrink-0" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
          />
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-4 px-4 md:px-0 space-y-4">
        {filtered.map((cat) => (
          <div key={cat.category}>
            <p className="text-xs font-semibold text-text-muted mb-2 px-1">{cat.category}</p>
            <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden">
              {cat.items.map((item, i) => {
                const key = `${cat.category}-${i}`;
                const open = openItem === key;
                return (
                  <div key={key} className="border-b border-border-primary last:border-0">
                    <button
                      onClick={() => setOpenItem(open ? null : key)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <span className="text-sm text-text-primary dark:text-white pr-3">{item.q}</span>
                      {open ? <ChevronUp size={16} className="text-text-muted flex-shrink-0" /> : <ChevronDown size={16} className="text-text-muted flex-shrink-0" />}
                    </button>
                    {open && (
                      <div className="px-4 pb-4 text-sm text-text-secondary dark:text-gray-300 leading-relaxed">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 联系客服 */}
      <div className="mt-6 px-4 md:px-0">
        <div className="bg-[#0d9488]/10 rounded-xl p-4 flex items-center gap-3">
          <MessageCircle size={24} className="text-[#0d9488] flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary dark:text-white">{t('noAnswer')}</p>
            <p className="text-xs text-text-muted mt-0.5">{t('supportHours')}</p>
          </div>
          <button className="text-sm font-medium text-[#0d9488] border border-[#0d9488] px-3 py-1.5 rounded-lg hover:bg-[#0d9488]/10 transition-colors">
            {t('contactSupport')}
          </button>
        </div>
      </div>
    </div>
  );
}
