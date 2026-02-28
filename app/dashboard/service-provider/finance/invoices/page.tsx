'use client';

import { FileText, Plus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

interface Invoice {
  id: string;
  amount: number;
  description: string;
  date: string;
  status: '已开具' | '处理中' | '已拒绝';
}

// TODO: Fetch from API
const mockInvoices: Invoice[] = [
  { id: '1', amount: 1200, description: '1月份服务收入发票', date: '2024-01-31', status: '已开具' },
  { id: '2', amount: 800, description: '12月份服务收入发票', date: '2023-12-31', status: '已开具' },
];

export default function InvoicesPage() {
  const statusStyle = {
    '已开具': 'bg-[#10b981]/20 text-[#10b981]',
    '处理中': 'bg-yellow-400/20 text-yellow-400',
    '已拒绝': 'bg-red-400/20 text-red-400',
  };

  return (
    <div>
      <PageHeader
        title="已开具发票"
        rightElement={
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-[#10b981] text-white">
            <Plus size={18} />
          </button>
        }
      />

      <div className="px-4">
        <p className="text-gray-400 text-xs mb-4">
          点击右上角"+"申请开具发票
        </p>

        {mockInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16">
            <div className="w-20 h-20 rounded-full bg-[#1a2332] flex items-center justify-center mb-4">
              <FileText size={32} className="text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">暂无发票记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mockInvoices.map((invoice) => (
              <div key={invoice.id} className="bg-[#1a2332] rounded-2xl px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-200 text-sm font-medium">{invoice.description}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{invoice.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-bold">${invoice.amount}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${statusStyle[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
