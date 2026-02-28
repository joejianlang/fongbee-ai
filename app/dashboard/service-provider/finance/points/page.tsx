'use client';

import { Star, Check } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

interface Plan {
  id: string;
  name: string;
  points: number;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: '基础版',
    points: 100,
    price: 0,
    period: '免费',
    features: ['每月最多接10单', '基础任务推送', '标准客服支持'],
  },
  {
    id: 'pro',
    name: '专业版',
    points: 500,
    price: 29,
    period: '/月',
    features: ['无限接单', '优先任务推送', '专属客服', '营业数据分析', '客户评价展示'],
    popular: true,
    current: true,
  },
  {
    id: 'elite',
    name: '精英版',
    points: 1200,
    price: 59,
    period: '/月',
    features: ['无限接单', '顶级任务优先', '专属客服经理', '高级数据报告', '推荐位展示', '合同模板'],
  },
];

export default function PointsPage() {
  const currentPoints = 100;

  return (
    <div>
      <PageHeader title="积分订阅" />

      <div className="px-4 space-y-4">
        {/* Current Balance */}
        <div className="bg-[#1a2332] rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#10b981]/20 flex items-center justify-center">
            <Star size={22} className="text-[#10b981] fill-[#10b981]" />
          </div>
          <div>
            <p className="text-gray-400 text-xs">当前积分余额</p>
            <p className="text-[#10b981] text-2xl font-bold">{currentPoints} 分</p>
          </div>
        </div>

        {/* Plans */}
        <p className="text-gray-300 text-sm font-medium">选择套餐</p>
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl p-5 border ${
              plan.current
                ? 'bg-[#10b981]/10 border-[#10b981]'
                : 'bg-[#1a2332] border-gray-700'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#10b981] text-white text-xs px-3 py-1 rounded-full font-medium">
                最受欢迎
              </span>
            )}
            {plan.current && (
              <span className="absolute -top-3 right-4 bg-[#253344] text-[#10b981] text-xs px-3 py-1 rounded-full border border-[#10b981]">
                当前套餐
              </span>
            )}

            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white text-base font-bold">{plan.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">{plan.points} 积分/月</p>
              </div>
              <div className="text-right">
                <span className="text-white text-2xl font-bold">
                  {plan.price === 0 ? '免费' : `$${plan.price}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-gray-400 text-xs">{plan.period}</span>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check size={14} className="text-[#10b981] flex-shrink-0" />
                  <span className="text-gray-300 text-xs">{f}</span>
                </div>
              ))}
            </div>

            {!plan.current && (
              <button className="w-full py-2.5 bg-[#10b981] text-white text-sm font-semibold rounded-xl hover:bg-[#0ea572] transition-colors">
                {plan.price === 0 ? '降级到基础版' : '升级到此套餐'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
