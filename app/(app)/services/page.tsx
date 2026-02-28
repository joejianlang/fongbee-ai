'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Search, Star, MapPin, CheckCircle, ChevronRight } from 'lucide-react';
import { MOCK_SERVICES } from '@/lib/mockServices';

interface ServiceCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export default function ServicesPage() {
  const t = useTranslations('services');

  const [search, setSearch]               = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories]         = useState<ServiceCategory[]>([]);
  const [catsLoading, setCatsLoading]       = useState(true);

  // Load categories from the admin-managed API
  useEffect(() => {
    fetch('/api/service-categories')
      .then((r) => r.json())
      .then((d) => { if (d.success) setCategories(d.data); })
      .catch(console.error)
      .finally(() => setCatsLoading(false));
  }, []);

  const filtered = MOCK_SERVICES.filter((s) => {
    const matchCat  = activeCategory === 'all' || s.category === activeCategory;
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
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchLabel')}
            className="flex-1 bg-transparent text-sm text-text-primary dark:text-white placeholder-text-muted outline-none"
          />
        </div>
      </div>

      {/* 分类 Tab */}
      <div className="bg-white dark:bg-[#2d2d30] border-b border-border-primary">
        <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide">
          {/* All — always first */}
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-[#7c3aed] text-white'
                : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10'
            }`}
          >
            {t('allCategory')}
          </button>

          {/* Dynamic categories from admin */}
          {catsLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-20 h-7 rounded-full bg-gray-100 dark:bg-white/10 animate-pulse" />
              ))
            : categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat.name
                      ? 'bg-[#7c3aed] text-white'
                      : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  {cat.icon && <span className="mr-1">{cat.icon}</span>}
                  {cat.name}
                </button>
              ))
          }
        </div>
      </div>

      {/* Custom service banner */}
      <div className="mx-3 md:mx-0 mt-3 bg-gradient-to-r from-[#0d9488] to-[#0a7c71] rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-white font-semibold text-base">{t('customBannerTitle')}</p>
          <p className="text-white/70 text-sm mt-0.5">{t('customBannerDesc')}</p>
        </div>
        <Link
          href="/services/custom"
          className="flex-shrink-0 bg-white text-[#0d9488] text-sm font-bold px-4 py-2 rounded-full hover:bg-white/90 transition-colors"
        >
          {t('customBannerBtn')}
        </Link>
      </div>

      {/* 服务卡片 */}
      <div className="mt-3 px-3 md:px-0 grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-text-muted">
            <p>{t('noRelated')}</p>
          </div>
        ) : (
          filtered.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.id}`}
              className="block bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
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
                  <span className="text-[#0d9488] text-sm font-semibold">{service.providerName}</span>
                  {service.isVerified && (
                    <CheckCircle size={12} className="text-[#0d9488]" fill="#0d9488" />
                  )}
                </div>

                {/* 标题 */}
                <h2 className="text-text-primary dark:text-white text-[15px] font-semibold mb-1 line-clamp-1">
                  {service.title}
                </h2>

                {/* 描述 */}
                <p className="text-text-muted text-sm line-clamp-2 mb-2.5">
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
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
