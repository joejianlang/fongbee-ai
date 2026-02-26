'use client';

import { useState } from 'react';
import { Copy, RefreshCw, Eye, EyeOff, Trash2 } from 'lucide-react';

interface APIKey {
  id: string;
  name: string;
  key: string;
  masked: string;
  permissions: string[];
  createdAt: string;
  lastUsed: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const MOCK_KEYS: APIKey[] = [
  {
    id: 'KEY001',
    name: '主 API 密钥',
    key: 'sk_live_abcd1234efgh5678ijkl9012mnop',
    masked: 'sk_live_••••••••••••••••••••••••••••••••',
    permissions: ['read', 'write', 'admin'],
    createdAt: '2025-06-15',
    lastUsed: '2025-12-15 14:32',
    status: 'ACTIVE',
  },
  {
    id: 'KEY002',
    name: '测试环境密钥',
    key: 'sk_test_xyz7890uvwab1234cdef5678ghij',
    masked: 'sk_test_••••••••••••••••••••••••••••••••',
    permissions: ['read', 'write'],
    createdAt: '2025-08-01',
    lastUsed: '2025-12-14 09:15',
    status: 'ACTIVE',
  },
  {
    id: 'KEY003',
    name: '旧密钥',
    key: '••••••••••••••••••••••••••••••••',
    masked: '••••••••••••••••••••••••••••••••',
    permissions: ['read'],
    createdAt: '2025-03-10',
    lastUsed: '2025-06-01 10:00',
    status: 'INACTIVE',
  },
];

export default function APISettingsPage() {
  const [showKey, setShowKey] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">API 设置</h1>
          <p className="text-text-secondary mt-1">管理 API 密钥和权限</p>
        </div>
        <button className="px-4 py-2.5 bg-[#0d9488] text-white rounded-lg font-medium hover:bg-[#0a7c71] transition-colors">
          + 生成新密钥
        </button>
      </div>

      <div className="space-y-4">
        {MOCK_KEYS.map((apiKey) => (
          <div key={apiKey.id} className="bg-card border border-card-border rounded-lg p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-text-primary mb-1">{apiKey.name}</h3>
                <p className="text-xs text-text-muted">
                  创建于：{apiKey.createdAt} · 最后使用：{apiKey.lastUsed}
                </p>
              </div>
              <span className={`px-3 py-1 rounded text-xs font-medium ${apiKey.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {apiKey.status === 'ACTIVE' ? '已激活' : '未激活'}
              </span>
            </div>

            <div className="mb-4 p-3 bg-background rounded-lg font-mono text-sm text-text-primary flex items-center justify-between">
              <span>
                {showKey === apiKey.id ? apiKey.key : apiKey.masked}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                  className="p-1 rounded hover:bg-card-border transition-colors"
                >
                  {showKey === apiKey.id ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button className="p-1 rounded hover:bg-card-border transition-colors">
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-text-secondary mb-2">权限：</p>
              <div className="flex flex-wrap gap-2">
                {apiKey.permissions.map((perm) => (
                  <span key={perm} className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                    {perm === 'read' && '读取'}
                    {perm === 'write' && '写入'}
                    {perm === 'admin' && '管理员'}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-card-border">
              <button className="px-3 py-1.5 text-sm rounded font-medium bg-[#0d9488]/10 text-[#0d9488] hover:bg-[#0d9488]/20 flex items-center gap-1">
                <RefreshCw size={14} />
                重新生成
              </button>
              <button className="px-3 py-1.5 text-sm rounded font-medium text-red-600 hover:bg-red-50 flex items-center gap-1">
                <Trash2 size={14} />
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
