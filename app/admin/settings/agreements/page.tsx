'use client';

import { useState } from 'react';
import { Edit2, Download, Clock } from 'lucide-react';

interface Agreement {
  id: string;
  name: string;
  description: string;
  version: string;
  lastModified: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

const MOCK_AGREEMENTS: Agreement[] = [
  { id: 'AGR001', name: '用户服务条款', description: '平台用户使用协议', version: 'v2.1', lastModified: '2025-12-10', status: 'ACTIVE' },
  { id: 'AGR002', name: '隐私政策', description: '数据隐私和保护政策', version: 'v1.8', lastModified: '2025-12-08', status: 'ACTIVE' },
  { id: 'AGR003', name: '服务商协议', description: '服务商入驻和运营协议', version: 'v2.0', lastModified: '2025-11-15', status: 'ACTIVE' },
  { id: 'AGR004', name: '支付服务协议', description: '支付和退款协议', version: 'v1.5', lastModified: '2025-10-20', status: 'ACTIVE' },
  { id: 'AGR005', name: '旧用户协议', description: '已废除的用户协议', version: 'v1.0', lastModified: '2025-08-01', status: 'ARCHIVED' },
];

export default function AgreementsPage() {
  const [activeTab, setActiveTab] = useState('ACTIVE');

  const filtered = MOCK_AGREEMENTS.filter((a) => a.status === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">协议文件管理</h1>
        <p className="text-text-secondary mt-1">管理服务条款和隐私政策</p>
      </div>

      <div className="flex gap-2 border-b border-card-border">
        {['ACTIVE', 'ARCHIVED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-[#0d9488] text-[#0d9488]'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'ACTIVE' ? '活跃协议' : '已归档'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-text-muted py-8">暂无协议</p>
        ) : (
          filtered.map((agreement) => (
            <div key={agreement.id} className="bg-card border border-card-border rounded-lg p-5 flex items-start justify-between hover:border-[#0d9488] transition-colors">
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary mb-1">{agreement.name}</h3>
                <p className="text-sm text-text-secondary mb-2">{agreement.description}</p>
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <span>版本：{agreement.version}</span>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    最后修改：{agreement.lastModified}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4 flex-shrink-0">
                <button className="p-2 rounded hover:bg-[#0d9488]/10 text-text-muted hover:text-[#0d9488] transition-colors">
                  <Edit2 size={18} />
                </button>
                <button className="p-2 rounded hover:bg-[#0d9488]/10 text-text-muted hover:text-[#0d9488] transition-colors">
                  <Download size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
