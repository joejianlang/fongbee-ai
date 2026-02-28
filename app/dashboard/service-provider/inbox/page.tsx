'use client';

import { useState } from 'react';
import { Mail, Bell, ChevronRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';

type InboxTab = 'messages' | 'notifications';

interface Message {
  id: string;
  from: string;
  preview: string;
  time: string;
  unread: boolean;
  type: 'order' | 'system' | 'customer';
}

// TODO: Fetch from API
const mockMessages: Message[] = [
  {
    id: '1',
    from: '系统通知',
    preview: '您有一个新的订单请求，请及时查看并确认。',
    time: '10分钟前',
    unread: true,
    type: 'system',
  },
  {
    id: '2',
    from: '客户 李先生',
    preview: '您好，我想询问一下您明天是否有空，需要家庭清洁服务。',
    time: '1小时前',
    unread: true,
    type: 'customer',
  },
  {
    id: '3',
    from: '系统通知',
    preview: '您上月的收入报告已生成，点击查看详情。',
    time: '昨天',
    unread: false,
    type: 'system',
  },
  {
    id: '4',
    from: '客户 张女士',
    preview: '谢谢您的服务，已给您五星好评！',
    time: '2天前',
    unread: false,
    type: 'customer',
  },
];

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<InboxTab>('messages');
  const unreadCount = mockMessages.filter((m) => m.unread).length;

  const iconByType = {
    order: '📋',
    system: '🔔',
    customer: '👤',
  };

  return (
    <div>
      <PageHeader title="收件箱" />

      <div className="px-4">
        {/* Tabs */}
        <div className="flex bg-[#1a2332] rounded-xl p-1 mb-5">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'messages' ? 'bg-[#10b981] text-white' : 'text-gray-400'
            }`}
          >
            <Mail size={15} />
            消息
            {unreadCount > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'notifications' ? 'bg-[#10b981] text-white' : 'text-gray-400'
            }`}
          >
            <Bell size={15} />
            通知
          </button>
        </div>

        {/* Message List */}
        <div className="space-y-3">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-4 rounded-2xl px-5 py-4 cursor-pointer transition-colors ${
                msg.unread ? 'bg-[#1e2a3a] border border-[#10b981]/20' : 'bg-[#1a2332]'
              }`}
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-[#253344] flex items-center justify-center text-lg flex-shrink-0">
                {iconByType[msg.type]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-gray-200 text-sm font-medium truncate">{msg.from}</p>
                  <p className="text-gray-500 text-xs ml-2 flex-shrink-0">{msg.time}</p>
                </div>
                <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                  {msg.preview}
                </p>
              </div>

              {msg.unread && (
                <div className="w-2 h-2 bg-[#10b981] rounded-full mt-2 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
