'use client';

import Link from 'next/link';
import { ArrowLeft, Heart, Trash2, Star, MapPin, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MOCK_SERVICES } from '@/lib/mockServices';

export default function BookmarksPage() {
  const t = useTranslations('bookmarks');
  const tCommon = useTranslations('common');
  const [bookmarks, setBookmarks] = useState(MOCK_SERVICES.slice(0, 3));

  const remove = (id: string) => setBookmarks((prev) => prev.filter((s) => s.id !== id));

  return (
    <div className="pb-6">
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors">
          <ArrowLeft size={18} />{tCommon('back')}
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">{t('title')}</span>
        <span className="ml-auto text-xs text-text-muted">{bookmarks.length} 项</span>
      </div>

      <div className="mt-2 px-3 md:px-0 space-y-3">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <Heart size={40} className="mb-3 opacity-30" />
            <p className="text-sm">{t('empty')}</p>
            <Link href="/services" className="mt-3 text-sm text-[#0d9488]">{t('browseServices')}</Link>
          </div>
        ) : (
          bookmarks.map((s) => (
            <div key={s.id} className="flex bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm overflow-hidden">
              <Link href={`/services/${s.id}`} className="flex flex-1 min-w-0">
                <img src={s.imageUrl} alt={s.title} className="w-24 h-24 object-cover flex-shrink-0" />
                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[#0d9488] text-xs font-semibold">{s.providerName}</span>
                    {s.isVerified && <CheckCircle size={11} className="text-[#0d9488]" fill="#0d9488" />}
                  </div>
                  <p className="text-sm font-semibold text-text-primary dark:text-white line-clamp-1">{s.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                    <div className="flex items-center gap-0.5">
                      <Star size={11} fill="#f59e0b" className="text-[#f59e0b]" />
                      <span className="font-medium text-text-primary dark:text-white">{s.rating}</span>
                      <span>({s.reviewCount})</span>
                    </div>
                    <MapPin size={10} /><span>{s.location.split(',')[0]}</span>
                  </div>
                  <p className="text-[#0d9488] font-bold text-sm mt-1">${s.basePrice}<span className="text-xs font-normal text-text-muted">/{s.priceUnit}</span></p>
                </div>
              </Link>
              <button
                onClick={() => remove(s.id)}
                className="px-3 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex-shrink-0"
                aria-label={t('removeBookmark')}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
