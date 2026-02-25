'use client';

import { useState } from 'react';
import { Search, Star, MapPin, CheckCircle, ChevronRight } from 'lucide-react';

interface MockService {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  priceUnit: string;
  category: string;
  rating: number;
  reviewCount: number;
  providerName: string;
  isVerified: boolean;
  location: string;
  imageUrl: string;
}

const MOCK_SERVICES: MockService[] = [
  {
    id: '1',
    title: '专业家居深度清洁',
    description: '两居室起，包含厨房油烟机、卫生间瓷砖深度清洁，环保无害洗剂',
    basePrice: 120,
    priceUnit: '次',
    category: '家居清洁',
    rating: 4.9,
    reviewCount: 134,
    providerName: '洁净之家',
    isVerified: true,
    location: 'Guelph, ON',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=250&fit=crop',
  },
  {
    id: '2',
    title: '儿童中文家教',
    description: '专业华裔教师，针对海外华人子女，普通话/粤语均可，寓教于乐',
    basePrice: 45,
    priceUnit: '小时',
    category: '教育辅导',
    rating: 5.0,
    reviewCount: 56,
    providerName: '张老师',
    isVerified: true,
    location: 'Waterloo, ON',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=250&fit=crop',
  },
  {
    id: '3',
    title: '搬家打包运输服务',
    description: '本地搬家，提供打包材料，小件到大件家具均可，准时高效',
    basePrice: 200,
    priceUnit: '次起',
    category: '搬家运输',
    rating: 4.7,
    reviewCount: 89,
    providerName: '快捷搬家',
    isVerified: true,
    location: 'Guelph, ON',
    imageUrl: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&h=250&fit=crop',
  },
  {
    id: '4',
    title: '草坪修剪 & 园艺护理',
    description: '季节性草坪护理，包含修剪、施肥、除草，按月订阅可享折扣',
    basePrice: 60,
    priceUnit: '次',
    category: '园艺',
    rating: 4.8,
    reviewCount: 72,
    providerName: '绿拇指园艺',
    isVerified: false,
    location: 'Cambridge, ON',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=250&fit=crop',
  },
  {
    id: '5',
    title: '华人注册会计师报税',
    description: 'CPA 持证，专为华人移民提供个人/家庭/小生意报税，含 RRSP 规划',
    basePrice: 150,
    priceUnit: '份',
    category: '财税',
    rating: 4.9,
    reviewCount: 201,
    providerName: '李会计事务所',
    isVerified: true,
    location: 'Mississauga, ON',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
  },
  {
    id: '6',
    title: '水电暖气维修',
    description: '持牌技工，漏水、电路、暖气故障均可上门，24小时紧急服务',
    basePrice: 80,
    priceUnit: '小时',
    category: '房屋维修',
    rating: 4.6,
    reviewCount: 167,
    providerName: '全能师傅',
    isVerified: true,
    location: 'Guelph, ON',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=250&fit=crop',
  },
];

const CATEGORIES = ['全部', '家居清洁', '教育辅导', '搬家运输', '园艺', '财税', '房屋维修'];

export default function ServicesPage() {
  const [search, setSearch]               = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');

  const filtered = MOCK_SERVICES.filter((s) => {
    const matchCat  = activeCategory === '全部' || s.category === activeCategory;
    const matchText = !search || s.title.includes(search) || s.description.includes(search);
    return matchCat && matchText;
  });

  return (
    <div className="pb-4">
      {/* 搜索栏 */}
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary shadow-sm px-3 py-2.5">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/10 rounded-full px-4 py-2">
          <Search size={15} className="text-text-muted flex-shrink-0" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索服务..."
            aria-label="搜索服务"
            className="flex-1 bg-transparent text-sm text-text-primary dark:text-white placeholder-text-muted outline-none"
          />
        </div>
      </div>

      {/* 分类 Tab */}
      <div className="bg-white dark:bg-[#2d2d30] border-b border-border-primary">
        <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-[#7c3aed] text-white'
                  : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 服务卡片 */}
      <div className="mt-2 px-3 md:px-0 grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-text-muted">
            <p>暂无相关服务</p>
          </div>
        ) : (
          filtered.map((service) => (
            <article
              key={service.id}
              className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            >
              {/* 图片 */}
              <div className="relative h-40 bg-gray-100 dark:bg-gray-700">
                <img
                  src={service.imageUrl}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 bg-white/90 dark:bg-black/60 text-text-primary dark:text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {service.category}
                </span>
              </div>

              {/* 内容 */}
              <div className="p-3">
                {/* 服务商 + 认证 */}
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[#0d9488] text-xs font-semibold">{service.providerName}</span>
                  {service.isVerified && (
                    <CheckCircle size={12} className="text-[#0d9488]" fill="#0d9488" />
                  )}
                </div>

                {/* 标题 */}
                <h2 className="text-text-primary dark:text-white text-sm font-semibold mb-1 line-clamp-1">
                  {service.title}
                </h2>

                {/* 描述 */}
                <p className="text-text-muted text-xs line-clamp-2 mb-2.5">
                  {service.description}
                </p>

                {/* 底部：评分 + 位置 + 价格 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <div className="flex items-center gap-0.5">
                      <Star size={12} fill="#f59e0b" className="text-[#f59e0b]" />
                      <span className="font-medium text-text-primary dark:text-white">{service.rating}</span>
                      <span>({service.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <MapPin size={11} />
                      <span>{service.location.split(',')[0]}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[#0d9488] font-semibold text-sm">
                    <span>$CAD {service.basePrice}</span>
                    <span className="text-xs font-normal text-text-muted">/{service.priceUnit}</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
