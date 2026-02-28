'use client';

import { FileCheck } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

interface Contract {
  id: string;
  clientName: string;
  service: string;
  amount: number;
  startDate: string;
  status: '有效' | '待签署' | '已到期' | '已终止';
}

// TODO: Fetch from API
const mockContracts: Contract[] = [
  {
    id: '1',
    clientName: '李先生',
    service: '家庭清洁（月度合同）',
    amount: 320,
    startDate: '2024-01-01',
    status: '有效',
  },
  {
    id: '2',
    clientName: '张女士',
    service: '水管维护年度协议',
    amount: 1200,
    startDate: '2024-01-15',
    status: '待签署',
  },
];

export default function ContractsPage() {
  const statusStyle: Record<Contract['status'], string> = {
    '有效': 'bg-[#10b981]/20 text-[#10b981]',
    '待签署': 'bg-yellow-400/20 text-yellow-400',
    '已到期': 'bg-gray-500/20 text-gray-400',
    '已终止': 'bg-red-400/20 text-red-400',
  };

  return (
    <div>
      <PageHeader title="合同管理" />

      <div className="px-4">
        {mockContracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16">
            <div className="w-20 h-20 rounded-full bg-[#1a2332] flex items-center justify-center mb-4">
              <FileCheck size={32} className="text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">暂无合同记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mockContracts.map((contract) => (
              <div key={contract.id} className="bg-[#1a2332] rounded-2xl px-5 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-gray-200 text-sm font-medium">{contract.clientName}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{contract.service}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${statusStyle[contract.status]}`}>
                    {contract.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                  <p className="text-gray-500 text-xs">生效日期：{contract.startDate}</p>
                  <p className="text-white text-sm font-bold">${contract.amount}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
