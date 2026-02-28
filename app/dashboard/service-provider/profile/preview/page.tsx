'use client';

import { Star, MapPin, Clock, Shield } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

export default function PreviewProfilePage() {
  // TODO: Fetch real provider data from API
  const provider = {
    name: '雪王',
    title: '专业家政服务',
    bio: '拥有5年专业家政服务经验，提供高质量的家庭清洁、水管维修和电气安装服务。持有相关行业认证，保险覆盖，让您安心无忧。',
    rating: 4.8,
    reviewCount: 56,
    completedOrders: 128,
    location: 'Guelph, ON',
    responseTime: '通常在1小时内回复',
    verified: true,
    services: [
      { name: '家庭清洁', price: 80, unit: '/次' },
      { name: '水管维修', price: 120, unit: '/小时' },
    ],
    badges: ['已认证', '快速响应', '5年经验'],
  };

  return (
    <div>
      <PageHeader title="我的展示主页预览" />

      {/* Preview Banner */}
      <div className="mx-4 mb-4 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-3">
        <p className="text-yellow-400 text-xs text-center">
          👁 以下是客户看到的您的个人主页
        </p>
      </div>

      <div className="px-4 space-y-4">
        {/* Profile Header */}
        <div className="bg-[#1a2332] rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-[#253344] flex items-center justify-center flex-shrink-0">
              <span className="text-[#10b981] text-2xl font-bold">
                {provider.name[0]}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-white text-lg font-bold">{provider.name}</h2>
                {provider.verified && (
                  <Shield size={16} className="text-[#10b981] fill-[#10b981]/20" />
                )}
              </div>
              <p className="text-gray-400 text-sm">{provider.title}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">{provider.rating}</span>
                <span className="text-gray-500 text-xs">({provider.reviewCount}条评价)</span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {provider.badges.map((badge) => (
              <span
                key={badge}
                className="bg-[#10b981]/15 text-[#10b981] text-xs px-3 py-1 rounded-full border border-[#10b981]/30"
              >
                {badge}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-[#253344] rounded-xl py-3">
              <p className="text-white text-lg font-bold">{provider.completedOrders}</p>
              <p className="text-gray-400 text-xs">已完成订单</p>
            </div>
            <div className="text-center bg-[#253344] rounded-xl py-3">
              <p className="text-white text-lg font-bold">{provider.rating}</p>
              <p className="text-gray-400 text-xs">综合评分</p>
            </div>
            <div className="text-center bg-[#253344] rounded-xl py-3">
              <p className="text-white text-lg font-bold">{provider.reviewCount}</p>
              <p className="text-gray-400 text-xs">客户评价</p>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-[#1a2332] rounded-2xl p-5">
          <h3 className="text-gray-200 text-sm font-semibold mb-3">关于我</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{provider.bio}</p>
        </div>

        {/* Info */}
        <div className="bg-[#1a2332] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-[#10b981]" />
            <span className="text-gray-300 text-sm">{provider.location}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-[#10b981]" />
            <span className="text-gray-300 text-sm">{provider.responseTime}</span>
          </div>
        </div>

        {/* Services */}
        <div className="bg-[#1a2332] rounded-2xl p-5">
          <h3 className="text-gray-200 text-sm font-semibold mb-3">提供的服务</h3>
          <div className="space-y-2">
            {provider.services.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between bg-[#253344] rounded-xl px-4 py-3"
              >
                <span className="text-gray-300 text-sm">{s.name}</span>
                <span className="text-[#10b981] text-sm font-semibold">
                  ${s.price}{s.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Button (preview) */}
        <button
          disabled
          className="w-full py-3 bg-[#10b981] text-white font-semibold rounded-xl opacity-50 cursor-not-allowed"
        >
          联系我（预览模式）
        </button>
      </div>
    </div>
  );
}
