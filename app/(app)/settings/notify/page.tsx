'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';

export default function NotifySettingsPage() {
  const t = useTranslations('settings');
  const tN = useTranslations('notify');
  const tCommon = useTranslations('common');

  const SETTINGS = [
    {
      group: tN('orderGroup'),
      items: [
        { key: 'orderConfirm',  label: tN('orderConfirm'),  desc: tN('orderConfirmDesc') },
        { key: 'orderRemind',   label: tN('orderRemind'),   desc: tN('orderRemindDesc') },
        { key: 'orderComplete', label: tN('orderComplete'), desc: tN('orderCompleteDesc') },
        { key: 'orderCancel',   label: tN('orderCancel'),   desc: tN('orderCancelDesc') },
      ],
    },
    {
      group: tN('messageGroup'),
      items: [
        { key: 'newMessage',   label: tN('newMessage'),   desc: tN('newMessageDesc') },
        { key: 'systemNotice', label: tN('systemNotice'), desc: tN('systemNoticeDesc') },
        { key: 'activity',     label: tN('activity'),     desc: tN('activityDesc') },
      ],
    },
    {
      group: tN('channelGroup'),
      items: [
        { key: 'pushNotif',  label: tN('pushNotif'),  desc: tN('pushNotifDesc') },
        { key: 'emailNotif', label: tN('emailNotif'), desc: tN('emailNotifDesc') },
        { key: 'smsNotif',   label: tN('smsNotif'),   desc: tN('smsNotifDesc') },
      ],
    },
  ];

  const initState = Object.fromEntries(
    SETTINGS.flatMap((g) => g.items.map((i) => [i.key, i.key !== 'activity' && i.key !== 'smsNotif']))
  );
  const [toggles, setToggles] = useState<Record<string, boolean>>(initState);

  const toggle = (key: string) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="pb-6">
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors">
          <ArrowLeft size={18} />{tCommon('back')}
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">{t('notifyTitle')}</span>
      </div>

      <div className="mt-3 px-4 md:px-0 space-y-3">
        {SETTINGS.map(({ group, items }) => (
          <div key={group} className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden">
            <p className="text-xs text-text-muted font-medium px-4 pt-3 pb-1.5">{group}</p>
            {items.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between px-4 py-3.5 border-t border-border-primary">
                <div>
                  <p className="text-sm text-text-primary dark:text-white">{label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => toggle(key)}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${toggles[key] ? 'bg-[#0d9488]' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${toggles[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
