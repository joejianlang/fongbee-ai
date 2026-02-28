'use client';

import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

type TxType = 'all' | 'income' | 'withdrawal';

interface Transaction {
  id: string;
  type: 'income' | 'withdrawal';
  amount: number;
  description: string;
  date: string;
  status: '已完成' | '处理中' | '失败';
}

// TODO: Fetch from API
const mockTransactions: Transaction[] = [
  { id: '1', type: 'income', amount: 320, description: '家庭清洁服务收入', date: '2024-01-20', status: '已完成' },
  { id: '2', type: 'withdrawal', amount: 500, description: '提现到银行账户', date: '2024-01-18', status: '已完成' },
  { id: '3', type: 'income', amount: 480, description: '水管维修服务收入', date: '2024-01-15', status: '已完成' },
  { id: '4', type: 'income', amount: 650, description: '电气安装服务收入', date: '2024-01-12', status: '处理中' },
  { id: '5', type: 'withdrawal', amount: 800, description: '提现到银行账户', date: '2024-01-10', status: '已完成' },
  { id: '6', type: 'income', amount: 200, description: '家庭清洁服务收入', date: '2024-01-08', status: '已完成' },
];

export default function TransactionsPage() {
  const [filter, setFilter] = useState<TxType>('all');

  const filtered = mockTransactions.filter(
    (t) => filter === 'all' || t.type === filter
  );

  const statusColor = {
    '已完成': 'text-[#10b981]',
    '处理中': 'text-yellow-400',
    '失败': 'text-red-400',
  };

  return (
    <div>
      <PageHeader title="交易记录" />

      <div className="px-4">
        {/* Filter Pills */}
        <div className="flex gap-2 mb-5">
          {(['all', 'income', 'withdrawal'] as TxType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-1.5 rounded-full text-sm transition-all border ${
                filter === type
                  ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]'
                  : 'bg-transparent text-gray-400 border-gray-600'
              }`}
            >
              {type === 'all' ? '全部' : type === 'income' ? '收入' : '提现'}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {filtered.map((tx) => (
            <div key={tx.id} className="flex items-center bg-[#1a2332] rounded-2xl px-5 py-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                  tx.type === 'income' ? 'bg-[#10b981]/15' : 'bg-orange-400/15'
                }`}
              >
                {tx.type === 'income' ? (
                  <ArrowDownLeft size={20} className="text-[#10b981]" />
                ) : (
                  <ArrowUpRight size={20} className="text-orange-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-gray-200 text-sm">{tx.description}</p>
                <p className="text-gray-500 text-xs mt-0.5">{tx.date}</p>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${
                    tx.type === 'income' ? 'text-[#10b981]' : 'text-orange-400'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}${tx.amount}
                </p>
                <p className={`text-xs mt-0.5 ${statusColor[tx.status]}`}>{tx.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
