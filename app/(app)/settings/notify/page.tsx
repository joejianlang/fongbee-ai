'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ToggleItem { label: string; desc: string; key: string; }

const SETTINGS: { group: string; items: ToggleItem[] }[] = [
  {
    group: '订单通知',
    items: [
      { key: 'orderConfirm', label: '订单确认',     desc: '服务商接单后通知我' },
      { key: 'orderRemind',  label: '服务提醒',     desc: '服务前 1 小时提醒' },
      { key: 'orderComplete',label: '服务完成',     desc: '服务结束后通知' },
      { key: 'orderCancel',  label: '订单取消',     desc: '订单被取消时通知' },
    ],
  },
  {
    group: '消息通知',
    items: [
      { key: 'newMessage',   label: '新消息',       desc: '收到服务商消息' },
      { key: 'systemNotice', label: '系统公告',     desc: '平台重要公告' },
      { key: 'activity',     label: '活动推广',     desc: '优惠活动与新服务推荐' },
    ],
  },
  {
    group: '通知方式',
    items: [
      { key: 'pushNotif',    label: 'App 推送',     desc: '浏览器 Push 通知' },
      { key: 'emailNotif',   label: '邮件通知',     desc: '发送到注册邮箱' },
      { key: 'smsNotif',     label: '短信通知',     desc: '发送到注册手机号' },
    ],
  },
];

export default function NotifySettingsPage() {
  const initState = Object.fromEntries(
    SETTINGS.flatMap((g) => g.items.map((i) => [i.key, i.key !== 'activity' && i.key !== 'smsNotif']))
  );
  const [toggles, setToggles] = useState<Record<string, boolean>>(initState);

  const toggle = (key: string) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="pb-6">
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors">
          <ArrowLeft size={18} />返回
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">通知设置</span>
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
