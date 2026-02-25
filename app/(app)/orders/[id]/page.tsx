'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Clock, Phone, MessageCircle, Star } from 'lucide-react';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const order = {
    id,
    service: '专业家居深度清洁',
    provider: '洁净之家',
    providerPhone: '+1 (519) 555-0123',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=200&fit=crop',
    package: '标准套餐',
    date: '2026-02-28',
    time: '10:00',
    address: '123 Gordon St, Guelph, ON N1G 1Y1',
    amount: 192,
    platformFee: 19.2,
    status: '待确认' as '待确认' | '进行中' | '已完成' | '已取消',
    note: '家里有猫，请注意关门',
    createdAt: '2026-02-25 14:32',
  };

  const STATUS_STEPS = ['已下单', '已确认', '服务中', '已完成'];
  const currentStep = 0;

  return (
    <div className="pb-32 md:pb-10">
      {/* 顶部 */}
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center gap-3">
        <Link href="/orders" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors">
          <ArrowLeft size={18} />
          返回
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">订单详情</span>
        <span className="ml-auto text-xs text-text-muted">#{order.id}</span>
      </div>

      <div className="px-4 md:px-0 mt-4 space-y-4">
        {/* 状态进度 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl p-4 shadow-sm">
          <p className="text-xs text-text-muted mb-3">订单状态</p>
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex-1 flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                  i <= currentStep ? 'bg-[#0d9488] text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className={`text-xs ${i <= currentStep ? 'text-[#0d9488] font-medium' : 'text-text-muted'}`}>{step}</span>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`absolute h-0.5 w-full ${i < currentStep ? 'bg-[#0d9488]' : 'bg-gray-200'}`} style={{ display: 'none' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 服务信息 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl overflow-hidden shadow-sm">
          <img src={order.imageUrl} alt={order.service} className="w-full h-40 object-cover" />
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-text-primary dark:text-white">{order.service}</p>
                <p className="text-xs text-[#0d9488] mt-0.5">{order.provider}</p>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium">{order.status}</span>
            </div>
            <p className="text-sm text-text-muted mt-2">套餐：{order.package}</p>
          </div>
        </div>

        {/* 预约信息 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="font-semibold text-text-primary dark:text-white text-sm mb-1">预约信息</h2>
          {[
            { icon: <Calendar size={15} className="text-[#0d9488]" />, label: '预约日期', value: order.date },
            { icon: <Clock size={15} className="text-[#0d9488]" />,    label: '预约时间', value: order.time },
            { icon: <MapPin size={15} className="text-[#0d9488]" />,   label: '上门地址', value: order.address },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="mt-0.5">{item.icon}</div>
              <div>
                <p className="text-xs text-text-muted">{item.label}</p>
                <p className="text-sm text-text-primary dark:text-white mt-0.5">{item.value}</p>
              </div>
            </div>
          ))}
          {order.note && (
            <div className="pt-2 border-t border-border-primary">
              <p className="text-xs text-text-muted">备注</p>
              <p className="text-sm text-text-secondary mt-0.5">{order.note}</p>
            </div>
          )}
        </div>

        {/* 费用明细 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-text-primary dark:text-white text-sm mb-3">费用明细</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>服务费用</span>
              <span>${(order.amount - order.platformFee).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>平台服务费</span>
              <span>${order.platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-text-primary dark:text-white border-t border-border-primary pt-2">
              <span>合计</span>
              <span className="text-[#0d9488]">${order.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 下单时间 */}
        <p className="text-xs text-text-muted text-center">下单时间：{order.createdAt}</p>
      </div>

      {/* 底部操作 */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white dark:bg-[#2d2d30] border-t border-border-primary px-4 py-3 flex gap-3 z-40">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-[#0d9488] text-[#0d9488] rounded-xl text-sm font-medium hover:bg-[#0d9488]/5 transition-colors">
          <Phone size={15} />
          联系服务商
        </button>
        {order.status === '已完成' ? (
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#0d9488] text-white rounded-xl text-sm font-medium hover:bg-[#0a7c71] transition-colors">
            <Star size={15} />
            写评价
          </button>
        ) : (
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#0d9488] text-white rounded-xl text-sm font-medium hover:bg-[#0a7c71] transition-colors">
            <MessageCircle size={15} />
            联系客服
          </button>
        )}
      </div>
    </div>
  );
}
