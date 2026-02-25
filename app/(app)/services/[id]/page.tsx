'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Star, MapPin, CheckCircle, Heart,
  Share2, Clock, ShieldCheck, ChevronRight,
} from 'lucide-react';
import { MOCK_SERVICES } from '@/lib/mockServices';

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const service = MOCK_SERVICES.find((s) => s.id === id) ?? MOCK_SERVICES[0];

  const REVIEWS = [
    { author: '王小明', rating: 5, date: '2026-02-10', content: '服务非常专业，师傅很细心，家里打扫得焕然一新！' },
    { author: '李美华', rating: 5, date: '2026-01-28', content: '预约很方便，准时上门，推荐给朋友了。' },
    { author: '张建国', rating: 4, date: '2026-01-15', content: '整体不错，价格合理，下次还会再约。' },
  ];

  return (
    <div className="pb-32 md:pb-10">
      {/* 顶部导航 */}
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center justify-between">
        <Link href="/services" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm">
          <ArrowLeft size={18} />
          返回
        </Link>
        <div className="flex items-center gap-3">
          <button className="p-1.5 text-text-muted hover:text-text-primary transition-colors" aria-label="收藏">
            <Heart size={20} />
          </button>
          <button className="p-1.5 text-text-muted hover:text-text-primary transition-colors" aria-label="分享">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* 封面图 */}
      <div className="relative h-52 md:h-72 bg-gray-100 dark:bg-gray-700">
        <img src={service.imageUrl} alt={service.title} className="w-full h-full object-cover" />
        <span className="absolute top-3 left-3 bg-white/90 dark:bg-black/60 text-text-primary dark:text-white text-xs px-2.5 py-1 rounded-full font-medium">
          {service.category}
        </span>
      </div>

      <div className="px-4 md:px-0 mt-4 space-y-5">
        {/* 服务商信息 */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#0d9488]/20 text-[#0d9488] flex items-center justify-center font-bold text-lg flex-shrink-0">
            {service.providerName[0]}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[#0d9488] font-semibold text-sm">{service.providerName}</span>
              {service.isVerified && <CheckCircle size={14} className="text-[#0d9488]" fill="#0d9488" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
              <MapPin size={11} />
              <span>{service.location}</span>
            </div>
          </div>
          <button className="ml-auto text-xs text-[#0d9488] border border-[#0d9488] px-3 py-1.5 rounded-full hover:bg-[#0d9488]/10 transition-colors">
            联系TA
          </button>
        </div>

        {/* 标题 + 评分 */}
        <div>
          <h1 className="text-xl font-bold text-text-primary dark:text-white">{service.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <div className="flex items-center gap-1">
              <Star size={14} fill="#f59e0b" className="text-[#f59e0b]" />
              <span className="font-semibold text-text-primary dark:text-white">{service.rating}</span>
              <span className="text-text-muted">({service.reviewCount} 评价)</span>
            </div>
            <span className="text-text-muted">·</span>
            <div className="flex items-center gap-1 text-text-muted">
              <Clock size={13} />
              <span>通常 2 小时内响应</span>
            </div>
          </div>
        </div>

        {/* 服务说明 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-text-primary dark:text-white mb-2">服务说明</h2>
          <p className="text-sm text-text-secondary dark:text-gray-300 leading-relaxed">{service.description}</p>
          <ul className="mt-3 space-y-1.5">
            {['专业工具及耗材自带', '服务完毕现场验收', '48小时取消政策', '持证上岗，全程保险'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-text-secondary">
                <ShieldCheck size={13} className="text-[#0d9488] flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 套餐选择 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-text-primary dark:text-white mb-3">选择套餐</h2>
          <div className="space-y-2">
            {[
              { name: '基础套餐', desc: '1–2居室，约3小时', price: service.basePrice },
              { name: '标准套餐', desc: '3居室，约5小时', price: Math.round(service.basePrice * 1.6) },
              { name: '豪华套餐', desc: '4居室以上，包含窗户清洁', price: Math.round(service.basePrice * 2.4) },
            ].map((pkg, i) => (
              <label key={pkg.name} className="flex items-center gap-3 p-3 border border-border-primary rounded-lg cursor-pointer hover:border-[#0d9488] transition-colors has-[:checked]:border-[#0d9488] has-[:checked]:bg-[#0d9488]/5">
                <input type="radio" name="package" defaultChecked={i === 0} className="accent-[#0d9488]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary dark:text-white">{pkg.name}</p>
                  <p className="text-xs text-text-muted">{pkg.desc}</p>
                </div>
                <span className="text-[#0d9488] font-bold text-sm">${pkg.price}<span className="text-xs font-normal text-text-muted">/{service.priceUnit}</span></span>
              </label>
            ))}
          </div>
        </div>

        {/* 用户评价 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-text-primary dark:text-white">用户评价</h2>
            <button className="flex items-center gap-0.5 text-xs text-[#0d9488]">全部 <ChevronRight size={13} /></button>
          </div>
          <div className="space-y-4">
            {REVIEWS.map((r) => (
              <div key={r.author} className="border-b border-border-primary last:border-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0d9488]/20 text-[#0d9488] flex items-center justify-center text-xs font-bold">{r.author[0]}</div>
                    <span className="text-sm font-medium text-text-primary dark:text-white">{r.author}</span>
                  </div>
                  <span className="text-xs text-text-muted">{r.date}</span>
                </div>
                <div className="flex mb-1.5">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={12} fill="#f59e0b" className="text-[#f59e0b]" />
                  ))}
                </div>
                <p className="text-xs text-text-secondary dark:text-gray-300">{r.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部下单栏 */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white dark:bg-[#2d2d30] border-t border-border-primary px-4 py-3 flex items-center gap-3 z-40 md:static md:border-0 md:bg-transparent md:px-0 md:mt-4">
        <div>
          <p className="text-xs text-text-muted">起步价</p>
          <p className="text-[#0d9488] font-bold text-lg">${service.basePrice} <span className="text-xs font-normal text-text-muted">/{service.priceUnit}</span></p>
        </div>
        <Link
          href={`/services/${service.id}/book`}
          className="flex-1 bg-[#0d9488] text-white text-center py-3 rounded-xl font-semibold text-sm hover:bg-[#0a7c71] transition-colors"
        >
          立即预约
        </Link>
      </div>
    </div>
  );
}
