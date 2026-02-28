'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ImagePlus, X, Send, Sparkles, Check, RotateCcw, Loader2 } from 'lucide-react';

const CATEGORIES = ['美食', '家政', '生活', '财税', '活动', '求助', '二手', '其他'];

type AiState = 'idle' | 'polishing' | 'reviewing';

export default function NewPostPage() {
  const router = useRouter();
  const t = useTranslations('forumNew');

  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState('');
  const [category, setCategory] = useState('');
  const [images,      setImages]      = useState<string[]>([]);
  const [location,    setLocation]    = useState('Guelph, ON');
  const [showLocation, setShowLocation] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  // AI 润色状态
  const [aiState,       setAiState]       = useState<AiState>('idle');
  const [aiError,       setAiError]       = useState('');
  const originalContentRef = useRef('');  // 保存润色前的原文

  const canSubmit = title.trim() && content.trim() && category;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => router.push('/forum'), 1200);
  };

  const handlePolish = async () => {
    if (!content.trim() || aiState !== 'idle') return;
    originalContentRef.current = content;
    setAiState('polishing');
    setAiError('');
    try {
      const res  = await fetch('/api/ai/polish', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content, title, category }),
      });
      const data = await res.json();
      if (data.success) {
        setContent(data.data.polished);
        setAiState('reviewing');
      } else {
        setAiError(data.error || t('polishError'));
        setAiState('idle');
      }
    } catch {
      setAiError(t('networkError'));
      setAiState('idle');
    }
  };

  const handleAccept = () => {
    setAiState('idle');
    originalContentRef.current = '';
  };

  const handleRevert = () => {
    setContent(originalContentRef.current);
    setAiState('idle');
    originalContentRef.current = '';
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#0d9488]/10 flex items-center justify-center mb-4">
          <span className="text-3xl">🎉</span>
        </div>
        <h2 className="text-lg font-bold text-text-primary dark:text-white mb-1">{t('successTitle')}</h2>
        <p className="text-sm text-text-muted">{t('successMsg')}</p>
      </div>
    );
  }

  return (
    <div className="pb-32 md:pb-10">
      {/* 顶部导航 */}
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center justify-between">
        <Link
          href="/forum"
          className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors"
        >
          <ArrowLeft size={18} />
          {t('cancel')}
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">{t('title')}</span>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting || aiState === 'polishing'}
          className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all ${
            canSubmit && !submitting && aiState !== 'polishing'
              ? 'bg-[#0d9488] text-white hover:bg-[#0a7c71]'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {submitting ? t('publishing') : t('publish')}
        </button>
      </div>

      <div className="px-4 md:px-0 mt-4 space-y-4">

        {/* 分类选择 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-text-muted mb-3">{t('selectCategory')} <span className="text-red-400">*</span></p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  category === cat
                    ? 'bg-[#0d9488] text-white border-[#0d9488]'
                    : 'border-border-primary text-text-secondary hover:border-[#0d9488] hover:text-[#0d9488]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 标题 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-text-muted mb-2">
            {t('titleLabel')} <span className="text-red-400">*</span>
            <span className="ml-1 font-normal text-text-muted/60">（{title.length}/50）</span>
          </p>
          <input
            type="text"
            maxLength={50}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            className="w-full bg-transparent text-sm text-text-primary dark:text-white placeholder-text-muted outline-none"
          />
        </div>

        {/* 正文内容 + AI 润色 */}
        <div className={`bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4 transition-all ${
          aiState === 'reviewing' ? 'ring-2 ring-purple-400 dark:ring-purple-500' : ''
        }`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-text-muted">
              {t('contentLabel')} <span className="text-red-400">*</span>
              <span className="ml-1 font-normal text-text-muted/60">（{content.length}/2000）</span>
            </p>
            {/* AI 润色 badge（reviewing 状态显示） */}
            {aiState === 'reviewing' && (
              <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-medium">
                <Sparkles size={12} />
                {t('aiPolished')}
              </span>
            )}
          </div>

          <textarea
            maxLength={2000}
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={aiState === 'polishing'}
            placeholder={t('contentPlaceholder')}
            className={`w-full bg-transparent text-sm text-text-primary dark:text-white placeholder-text-muted outline-none resize-none leading-relaxed ${
              aiState === 'polishing' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />

          {/* 错误提示 */}
          {aiError && (
            <p className="mt-2 text-xs text-red-500">{aiError}</p>
          )}

          {/* AI 操作栏 */}
          <div className="mt-3 flex items-center gap-2">
            {aiState === 'idle' && (
              <button
                onClick={handlePolish}
                disabled={!content.trim()}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  content.trim()
                    ? 'border-purple-400 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    : 'border-border-primary text-text-muted cursor-not-allowed opacity-50'
                }`}
              >
                <Sparkles size={12} />
                {t('aiPolish')}
              </button>
            )}

            {aiState === 'polishing' && (
              <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                <Loader2 size={13} className="animate-spin" />
                <span>{t('aiPolishing')}</span>
              </div>
            )}

            {aiState === 'reviewing' && (
              <>
                <button
                  onClick={handleAccept}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors"
                >
                  <Check size={12} />
                  {t('accept')}
                </button>
                <button
                  onClick={handleRevert}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border-primary text-text-secondary hover:text-text-primary font-medium transition-colors"
                >
                  <RotateCcw size={12} />
                  {t('revert')}
                </button>
                <span className="text-xs text-text-muted ml-1">{t('editAfterAi')}</span>
              </>
            )}
          </div>
        </div>

        {/* 图片上传 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-text-muted mb-3">{t('addImages')}</p>
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
            {images.length < 9 && (
              <button
                onClick={() => {
                  setImages((prev) => [
                    ...prev,
                    `https://images.unsplash.com/photo-150094214${prev.length}?w=160&h=160&fit=crop`,
                  ]);
                }}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-border-primary flex flex-col items-center justify-center gap-1 text-text-muted hover:border-[#0d9488] hover:text-[#0d9488] transition-colors"
              >
                <ImagePlus size={20} />
                <span className="text-xs">{t('addBtn')}</span>
              </button>
            )}
          </div>
        </div>

        {/* 位置 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-text-muted">{t('locationLabel')}</p>
            <button
              onClick={() => setShowLocation((v) => !v)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                showLocation ? 'bg-[#0d9488]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              role="switch"
              aria-checked={showLocation}
              aria-label={t('locationLabel')}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                  showLocation ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {showLocation ? (
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('locationPlaceholder')}
              className="w-full bg-transparent text-sm text-text-primary dark:text-white placeholder-text-muted outline-none"
            />
          ) : (
            <p className="text-xs text-amber-500 dark:text-amber-400">
              {t('locationWarning')}
            </p>
          )}
        </div>

        {/* 发帖须知 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
          <p className="font-semibold mb-1.5">{t('rulesTitle')}</p>
          <p>{t('rule1')}</p>
          <p>{t('rule2')}</p>
          <p>{t('rule3')}</p>
          <p>{t('rule4')}</p>
        </div>
      </div>

      {/* 底部固定发布按钮（移动端） */}
      <div className="fixed bottom-16 md:hidden left-0 right-0 bg-white dark:bg-[#2d2d30] border-t border-border-primary px-4 py-3 z-40">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting || aiState === 'polishing'}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
            canSubmit && !submitting && aiState !== 'polishing'
              ? 'bg-[#0d9488] text-white hover:bg-[#0a7c71]'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Send size={15} />
          {submitting ? t('publishing') : canSubmit ? t('publishPost') : t('fillRequired')}
        </button>
      </div>
    </div>
  );
}
