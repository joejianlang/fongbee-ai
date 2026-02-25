'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/Card';
import { FileText, Clock, Users, TrendingUp } from 'lucide-react';

interface DashboardStats {
  todayOrders: number;
  pendingOrders: number;
  activeProviders: number;
  monthlyRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    pendingOrders: 0,
    activeProviders: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // TODO: 实现 GET /api/admin/stats 端点
        // const response = await fetch('/api/admin/stats');
        // const data = await response.json();
        // setStats(data.data);

        // Mock data for now
        setStats({
          todayOrders: 42,
          pendingOrders: 18,
          activeProviders: 156,
          monthlyRevenue: 12450,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">控制台</h1>
        <p className="text-text-secondary">数据概览与统计</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="今日新增订单"
          value={stats.todayOrders}
          trend="12% 较昨日"
          icon={<FileText size={24} />}
          bgColor="#dbeafe"
          iconColor="#3b82f6"
        />
        <StatsCard
          label="待处理需求"
          value={stats.pendingOrders}
          trend="需要尽快处理"
          icon={<Clock size={24} />}
          bgColor="#fed7aa"
          iconColor="#f59e0b"
        />
        <StatsCard
          label="活跃服务商"
          value={stats.activeProviders}
          trend="↑ 5 本周新增"
          icon={<Users size={24} />}
          bgColor="#d1fae5"
          iconColor="#10b981"
        />
        <StatsCard
          label="本月成交额"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          trend="↑ 23% 较上月"
          icon={<TrendingUp size={24} />}
          bgColor="#ede9fe"
          iconColor="#a855f7"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placeholder Chart */}
        <div className="bg-card border border-card-border rounded-lg p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4">
            订单趋势 (近7天)
          </h3>
          <div className="h-64 flex items-center justify-center bg-opacity-50 rounded-lg border border-card-border">
            <p className="text-text-muted">图表区域（待实现）</p>
          </div>
        </div>

        {/* Service Distribution */}
        <div className="bg-card border border-card-border rounded-lg p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4">
            服务类型分布
          </h3>
          <div className="space-y-4">
            {[
              { name: '标准服务', count: 245, color: '#10b981' },
              { name: '简单定制', count: 156, color: '#3b82f6' },
              { name: '复杂定制', count: 45, color: '#f59e0b' },
            ].map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">{item.name}</span>
                  <span className="text-text-primary font-medium">{item.count} 单</span>
                </div>
                <div className="w-full bg-card-border rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${(item.count / 446) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <div className="p-6 border-b border-card-border flex justify-between items-center">
          <h3 className="text-lg font-bold text-text-primary">最新订单</h3>
          <a
            href="/admin/orders"
            className="text-text-accent hover:underline text-sm"
          >
            查看全部 →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border bg-opacity-50">
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">
                  订单号
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">
                  服务类型
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">
                  金额
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  id: '#ORD001',
                  type: '标准服务',
                  user: 'John Doe',
                  amount: '$150.00',
                  status: '✅ 已完成',
                },
                {
                  id: '#ORD002',
                  type: '简单定制',
                  user: 'Jane Doe',
                  amount: '$320.00',
                  status: '⏳ 进行中',
                },
                {
                  id: '#ORD003',
                  type: '复杂定制',
                  user: 'Bob Smith',
                  amount: '$2400.0',
                  status: '⚠️ 待处理',
                },
              ].map((row) => (
                <tr key={row.id} className="border-b border-card-border hover:bg-opacity-50">
                  <td className="px-6 py-4 text-sm font-medium text-text-primary">
                    {row.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{row.type}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{row.user}</td>
                  <td className="px-6 py-4 text-sm text-text-primary font-medium">
                    {row.amount}
                  </td>
                  <td className="px-6 py-4 text-sm">{row.status}</td>
                  <td className="px-6 py-4 text-sm">
                    <a
                      href="#"
                      className="text-text-accent hover:underline"
                    >
                      查看
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
