'use client';

import { BarChart3, TrendingUp } from 'lucide-react';

export default function AdsAnalyticsPage() {
  const metrics = [
    { label: '总展示数', value: '12,450', change: '+15%', trend: 'up' },
    { label: '总点击数', value: '3,847', change: '+23%', trend: 'up' },
    { label: '点击率 (CTR)', value: '30.9%', change: '+5%', trend: 'up' },
    { label: '转化率', value: '12.4%', change: '-2%', trend: 'down' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">广告分析</h1>
        <p className="text-text-secondary mt-1">查看广告投放数据和效果</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-card border border-card-border rounded-lg p-5">
            <p className="text-sm text-text-secondary mb-2">{metric.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-text-primary">{metric.value}</p>
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${metric.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <TrendingUp size={12} />
                {metric.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-card-border rounded-lg p-6">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <BarChart3 size={18} />
            每日展示统计
          </h2>
          <div className="space-y-3">
            {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, idx) => (
              <div key={day} className="flex items-center gap-3">
                <span className="w-12 text-sm text-text-secondary">{day}</span>
                <div className="flex-1 h-2 bg-card-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0d9488] rounded-full"
                    style={{ width: `${30 + idx * 10}%` }}
                  />
                </div>
                <span className="text-sm text-text-primary font-medium w-16 text-right">{1800 + idx * 200}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-6">
          <h2 className="text-base font-bold text-text-primary mb-4">广告位置效果</h2>
          <div className="space-y-3">
            {[
              { name: '首页顶部', clicks: 1245, value: 45 },
              { name: '首页底部', clicks: 856, value: 32 },
              { name: '详情页侧栏', clicks: 1746, value: 63 },
            ].map((item) => (
              <div key={item.name} className="p-3 border border-card-border rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">{item.name}</span>
                  <span className="text-sm text-text-secondary">{item.clicks} 次点击</span>
                </div>
                <div className="h-2 bg-card-border rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
