'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, MapPin, Mail, Globe } from 'lucide-react';

export default function AboutPage() {
  const t = useTranslations('about');
  const tCommon = useTranslations('common');

  return (
    <div className="pb-6">
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors">
          <ArrowLeft size={18} />{tCommon('back')}
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">{t('title')}</span>
      </div>

      <div className="px-4 md:px-0 mt-6 space-y-5">
        {/* Logo + 名称 */}
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-2xl bg-[#0d9488] flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-black text-3xl">数</span>
          </div>
          <h1 className="text-xl font-bold text-text-primary dark:text-white">数位 Buffet</h1>
          <p className="text-sm text-text-muted mt-1">Version 1.0.0</p>
        </div>

        {/* 简介 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-text-primary dark:text-white mb-3">{t('intro')}</h2>
          <p className="text-sm text-text-secondary dark:text-gray-300 leading-relaxed">
            数位 Buffet（原：优服佳）是专为大多伦多地区华人社区打造的本地生活服务平台。
            我们连接有需求的华人家庭与专业华人服务商，涵盖家居清洁、教育辅导、园艺、财税咨询等多个类别。
          </p>
          <p className="text-sm text-text-secondary dark:text-gray-300 leading-relaxed mt-3">
            我们的使命是让每一位华人新移民都能便捷地获得可信赖的本地服务，消除语言障碍，建设更紧密的社区联结。
          </p>
        </div>

        {/* 联系方式 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden">
          <p className="text-xs text-text-muted font-medium px-4 pt-3 pb-1.5">{t('contact')}</p>
          {[
            { icon: Mail,   label: t('customerEmail'), value: 'support@shuweibuffet.ca' },
            { icon: MapPin, label: t('companyAddress'), value: 'Guelph, Ontario, Canada' },
            { icon: Globe,  label: t('officialSite'),   value: 'www.shuweibuffet.ca' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3.5 border-t border-border-primary">
              <Icon size={18} className="text-[#0d9488] flex-shrink-0" />
              <div>
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-sm text-text-primary dark:text-white mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 法律链接 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden">
          <p className="text-xs text-text-muted font-medium px-4 pt-3 pb-1.5">{t('legal')}</p>
          {[t('terms'), t('privacy'), t('refund'), t('openSource')].map((label) => (
            <button key={label} className="w-full flex items-center justify-between px-4 py-3.5 border-t border-border-primary hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left">
              <span className="text-sm text-text-primary dark:text-white">{label}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-text-muted pb-2">
          © 2026 数位 Buffet Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}
