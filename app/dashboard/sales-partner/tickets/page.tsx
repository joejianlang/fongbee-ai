'use client';

import { useState } from 'react';
import { ClipboardList } from 'lucide-react';

type TicketFilter = '全部' | '进行中' | '待确认' | '已完成' | '已取消';

interface Ticket {
  id: string;
  orderNo: string;
  providerName: string;
  service: string;
  clientName: string;
  amount: number;
  commission: number;
  date: string;
  status: '进行中' | '待确认' | '已完成' | '已取消';
}

// TODO: Fetch from API
const mockTickets: Ticket[] = [
  { id: '1', orderNo: 'ORD-2024-0120', providerName: '李明', service: '家庭清洁', clientName: '周先生', amount: 160, commission: 16, date: '2024-01-20', status: '进行中' },
  { id: '2', orderNo: 'ORD-2024-0118', providerName: '张华', service: '水管维修', clientName: '孙女士', amount: 240, commission: 24, date: '2024-01-18', status: '待确认' },
  { id: '3', orderNo: 'ORD-2024-0115', providerName: '王芳', service: '家庭清洁', clientName: '赵先生', amount: 160, commission: 16, date: '2024-01-15', status: '已完成' },
  { id: '4', orderNo: 'ORD-2024-0110', providerName: '李明', service: '电气安装', clientName: '钱女士', amount: 300, commission: 30, date: '2024-01-10', status: '已完成' },
];

const filters: TicketFilter[] = ['全部', '进行中', '待确认', '已完成', '已取消'];
const statusStyle: Record<Ticket['status'], string> = {
  '进行中': 'bg-blue-400/20 text-blue-400',
  '待确认': 'bg-yellow-400/20 text-yellow-400',
  '已完成': 'bg-[#0d9488]/20 text-[#0d9488]',
  '已取消': 'bg-gray-500/20 text-gray-400',
};

export default function TicketsPage() {
  const [filter, setFilter] = useState<TicketFilter>('全部');

  const filtered = mockTickets.filter(
    (t) => filter === '全部' || t.status === filter
  );

  return (
    <div className="px-4 py-5">
      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border transition-all ${
              filter === f
                ? 'bg-[#0d9488]/20 text-[#0d9488] border-[#0d9488]'
                : 'bg-transparent text-gray-400 border-gray-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-16">
          <div className="w-20 h-20 rounded-full bg-[#1a2332] flex items-center justify-center mb-4">
            <ClipboardList size={32} className="text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm">暂无工单</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="bg-[#1a2332] rounded-2xl px-5 py-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-gray-200 text-sm font-medium">{t.service}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{t.orderNo}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${statusStyle[t.status]}`}>
                  {t.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-700">
                <div>
                  <p className="text-gray-500 text-xs">服务商</p>
                  <p className="text-gray-300 text-xs mt-0.5 font-medium">{t.providerName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">客户</p>
                  <p className="text-gray-300 text-xs mt-0.5 font-medium">{t.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs">我的佣金</p>
                  <p className="text-[#0d9488] text-sm font-bold">+${t.commission}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
