'use client';

import { useState } from 'react';
import { Search, UserCheck, UserX, ShieldCheck } from 'lucide-react';

type Role = '全部' | 'customer' | 'service_provider' | 'admin';
type UserStatus = 'active' | 'suspended';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'service_provider' | 'admin';
  status: UserStatus;
  joinDate: string;
  orders: number;
}

const MOCK_USERS: AppUser[] = [
  { id: 'U001', name: 'Alice Wang',   email: 'alice@example.com',  role: 'customer',          status: 'active',    joinDate: '2025-10-01', orders: 12 },
  { id: 'U002', name: 'Bob Zhang',    email: 'bob@example.com',    role: 'service_provider',  status: 'active',    joinDate: '2025-09-15', orders: 47 },
  { id: 'U003', name: 'Carol Liu',    email: 'carol@example.com',  role: 'customer',          status: 'active',    joinDate: '2025-11-20', orders: 3  },
  { id: 'U004', name: 'David Chen',   email: 'david@example.com',  role: 'service_provider',  status: 'suspended', joinDate: '2025-08-05', orders: 89 },
  { id: 'U005', name: 'Emma Zhou',    email: 'emma@example.com',   role: 'customer',          status: 'active',    joinDate: '2026-01-02', orders: 1  },
  { id: 'U006', name: 'Frank Wu',     email: 'frank@example.com',  role: 'customer',          status: 'active',    joinDate: '2025-12-18', orders: 6  },
  { id: 'U007', name: 'Grace Li',     email: 'grace@example.com',  role: 'admin',             status: 'active',    joinDate: '2025-07-01', orders: 0  },
  { id: 'U008', name: 'Henry Guo',    email: 'henry@example.com',  role: 'service_provider',  status: 'active',    joinDate: '2025-10-30', orders: 33 },
];

const ROLE_LABELS: Record<AppUser['role'], string> = {
  customer: '客户',
  service_provider: '服务商',
  admin: '管理员',
};

const ROLE_STYLES: Record<AppUser['role'], string> = {
  customer: 'bg-blue-100 text-blue-700',
  service_provider: 'bg-green-100 text-green-700',
  admin: 'bg-purple-100 text-purple-700',
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole]     = useState<Role>('全部');

  const filtered = MOCK_USERS.filter((u) => {
    const matchRole   = role === '全部' || u.role === role;
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const counts = {
    total:    MOCK_USERS.length,
    active:   MOCK_USERS.filter((u) => u.status === 'active').length,
    providers:MOCK_USERS.filter((u) => u.role === 'service_provider').length,
    suspended:MOCK_USERS.filter((u) => u.status === 'suspended').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">用户管理</h1>
        <p className="text-text-secondary mt-1">查看平台所有用户账户</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '总用户',   value: counts.total,    color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: '活跃用户', value: counts.active,   color: 'text-green-600',  bg: 'bg-green-50' },
          { label: '服务商',   value: counts.providers,color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: '已封禁',   value: counts.suspended,color: 'text-red-500',    bg: 'bg-red-50' },
        ].map((c) => (
          <div key={c.label} className={`${c.bg} rounded-xl px-5 py-4`}>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-sm text-text-secondary mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索用户名 / 邮箱 / ID..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-card-border rounded-lg bg-card text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40"
          />
        </div>
        <div className="flex gap-1">
          {(['全部', 'customer', 'service_provider', 'admin'] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                role === r
                  ? 'bg-[#0d9488] text-white'
                  : 'bg-card border border-card-border text-text-secondary hover:bg-gray-50'
              }`}
            >
              {r === '全部' ? '全部' : ROLE_LABELS[r as AppUser['role']]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-gray-50 dark:bg-white/5">
                {['ID', '用户名', '邮箱', '角色', '状态', '注册日期', '订单数', '操作'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-text-secondary whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-text-muted">暂无用户</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-b border-card-border last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-text-muted">{u.id}</td>
                    <td className="px-5 py-3.5 font-medium text-text-primary flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#0d9488]/20 text-[#0d9488] flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {u.name[0]}
                      </div>
                      {u.name}
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.status === 'active' ? (
                        <span className="flex items-center gap-1 text-xs text-green-600"><UserCheck size={12} />正常</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-500"><UserX size={12} />已封禁</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-text-muted whitespace-nowrap">{u.joinDate}</td>
                    <td className="px-5 py-3.5 text-text-primary font-medium">{u.orders}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <button className="text-[#0d9488] hover:underline text-xs font-medium">查看</button>
                        {u.role !== 'admin' && (
                          <button className={`text-xs font-medium ${u.status === 'active' ? 'text-red-400 hover:underline' : 'text-green-500 hover:underline'}`}>
                            {u.status === 'active' ? '封禁' : '恢复'}
                          </button>
                        )}
                        {u.role === 'service_provider' && (
                          <button className="text-purple-500 hover:underline text-xs font-medium flex items-center gap-0.5">
                            <ShieldCheck size={11} />认证
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-card-border text-xs text-text-muted">
          <span>共 {filtered.length} 位用户</span>
          <div className="flex gap-1">
            {[1, 2, 3].map((p) => (
              <button key={p} className={`w-7 h-7 rounded text-xs font-medium ${p === 1 ? 'bg-[#0d9488] text-white' : 'hover:bg-gray-100 text-text-secondary'}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
