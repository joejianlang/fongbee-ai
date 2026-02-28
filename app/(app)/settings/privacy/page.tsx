'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Shield, Eye, Trash2, Download, Lock } from 'lucide-react';

export default function PrivacyPage() {
  const t = useTranslations('privacy');
  const tSettings = useTranslations('settings');
  const tCommon = useTranslations('common');

  const [showHistory, setShowHistory] = useState(true);
  const [shareLocation, setShareLocation] = useState(true);
  const [personalized, setPersonalized] = useState(true);

  return (
    <div className="pb-6">
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors">
          <ArrowLeft size={18} />{tCommon('back')}
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">{tSettings('privacyTitle')}</span>
      </div>

      <div className="mt-3 px-4 md:px-0 space-y-3">
        {/* 隐私设置 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden">
          <p className="text-xs text-text-muted font-medium px-4 pt-3 pb-1.5">{t('privacySettings')}</p>
          {[
            { label: t('showHistory'),   desc: t('showHistoryDesc'),   value: showHistory,   set: setShowHistory },
            { label: t('shareLocation'), desc: t('shareLocationDesc'), value: shareLocation, set: setShareLocation },
            { label: t('personalized'),  desc: t('personalizedDesc'),  value: personalized,  set: setPersonalized },
          ].map(({ label, desc, value, set }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3.5 border-t border-border-primary">
              <div>
                <p className="text-sm text-text-primary dark:text-white">{label}</p>
                <p className="text-xs text-text-muted mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => set(!value)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${value ? 'bg-[#0d9488]' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>

        {/* 账户安全 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden">
          <p className="text-xs text-text-muted font-medium px-4 pt-3 pb-1.5">{t('accountSecurity')}</p>
          {[
            { icon: Lock,   label: t('changePassword'), desc: t('changePasswordDesc'), badge: ''                 },
            { icon: Shield, label: t('twoFactor'),      desc: t('twoFactorDesc'),      badge: t('recommended')   },
            { icon: Eye,    label: t('loginDevices'),   desc: t('loginDevicesDesc'),   badge: ''                 },
          ].map(({ icon: Icon, label, desc, badge }) => (
            <button key={label} className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-border-primary hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left">
              <Icon size={18} className="text-text-secondary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-text-primary dark:text-white">{label}</p>
                <p className="text-xs text-text-muted">{desc}</p>
              </div>
              {badge && <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">{badge}</span>}
              <ArrowRight />
            </button>
          ))}
        </div>

        {/* 数据与隐私 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden">
          <p className="text-xs text-text-muted font-medium px-4 pt-3 pb-1.5">{t('dataManagement')}</p>
          {[
            { icon: Download, label: t('exportData'),    desc: t('exportDataDesc'),    color: 'text-blue-500' },
            { icon: Trash2,   label: t('deleteAccount'), desc: t('deleteAccountDesc'), color: 'text-red-500'  },
          ].map(({ icon: Icon, label, desc, color }) => (
            <button key={label} className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-border-primary hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left">
              <Icon size={18} className={`${color} flex-shrink-0`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${color}`}>{label}</p>
                <p className="text-xs text-text-muted">{desc}</p>
              </div>
              <ArrowRight />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
