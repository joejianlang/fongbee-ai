'use client';

import { TrendingUp, Users, DollarSign, ShoppingBag } from 'lucide-react';

export default function ReportAnalyticsPage() {
  const reports = [
    { icon: Users, label: '活跃用户', value: '2,456', change: '+12%', color: 'text-blue-600' },
    { icon: ShoppingBag, label: '订单总数', value: '1,245', change: '+8%', color: 'text-green-600' },
    { icon: DollarSign, label: '总收入', value: '$45,230', change: '+23%', color: 'text-purple-600' },
    { icon: TrendingUp, label: '增长率', value: '15.2%', change: '+5%', color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">报表分析</h1>
        <p className="text-text-secondary mt-1">平台运营数据报表</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.label} className="bg-card border border-card-border rounded-lg p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${report.color.replace('text-', 'bg-')}/10`}>
                  <Icon size={20} className={report.color} />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                  {report.change}
                </span>
              </div>
              <p className="text-sm text-text-secondary mb-1">{report.label}</p>
              <p className="text-2xl font-bold text-text-primary">{report.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-card-border rounded-lg p-6">
          <h2 className="text-base font-bold text-text-primary mb-4">月度增长趋势</h2>
          <div className="space-y-2">
            {['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'].map((month, idx) => (
              <div key={month} className="flex items-center gap-3">
                <span className="w-10 text-xs text-text-secondary">{month}</span>
                <div className="flex-1 h-2 bg-card-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0d9488] rounded-full"
                    style={{ width: `${20 + idx * 6}%` }}
                  />
                </div>
                <span className="text-xs text-text-primary font-medium w-8 text-right">{1200 + idx * 300}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-6">
          <h2 className="text-base font-bold text-text-primary mb-4">订单来源分布</h2>
          <div className="space-y-3">
            {[
              { source: '直接访问', count: 245, percentage: 35 },
              { source: '搜索引擎', count: 189, percentage: 27 },
              { source: '推荐链接', count: 156, percentage: 22 },
              { source: '应用内推荐', count: 122, percentage: 16 },
            ].map((item) => (
              <div key={item.source}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-text-primary font-medium">{item.source}</span>
                  <span className="text-sm text-text-secondary">{item.count}</span>
                </div>
                <div className="h-2 bg-card-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
