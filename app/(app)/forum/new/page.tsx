'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ImagePlus, X, Send } from 'lucide-react';

const CATEGORIES = ['美食', '家政', '生活', '财税', '活动', '求助', '二手', '其他'];

export default function NewPostPage() {
  const router = useRouter();

  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState('');
  const [category, setCategory] = useState('');
  const [images,   setImages]   = useState<string[]>([]);
  const [location, setLocation] = useState('Guelph, ON');
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const canSubmit = title.trim() && content.trim() && category;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    // 模拟提交延迟
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => router.push('/forum'), 1200);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#0d9488]/10 flex items-center justify-center mb-4">
          <span className="text-3xl">🎉</span>
        </div>
        <h2 className="text-lg font-bold text-text-primary dark:text-white mb-1">发布成功！</h2>
        <p className="text-sm text-text-muted">正在返回论坛...</p>
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
          取消
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">发布帖子</span>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all ${
            canSubmit && !submitting
              ? 'bg-[#0d9488] text-white hover:bg-[#0a7c71]'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {submitting ? '发布中…' : '发布'}
        </button>
      </div>

      <div className="px-4 md:px-0 mt-4 space-y-4">

        {/* 分类选择 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-text-muted mb-3">选择分类 <span className="text-red-400">*</span></p>
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
            标题 <span className="text-red-400">*</span>
            <span className="ml-1 font-normal text-text-muted/60">（{title.length}/50）</span>
          </p>
          <input
            type="text"
            maxLength={50}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入帖子标题，简洁明了..."
            className="w-full bg-transparent text-sm text-text-primary dark:text-white placeholder-text-muted outline-none"
          />
        </div>

        {/* 正文内容 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-text-muted mb-2">
            正文 <span className="text-red-400">*</span>
            <span className="ml-1 font-normal text-text-muted/60">（{content.length}/2000）</span>
          </p>
          <textarea
            maxLength={2000}
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的经历、问题或信息，让更多人看到...

支持换行，可以写得详细一点 😊"
            className="w-full bg-transparent text-sm text-text-primary dark:text-white placeholder-text-muted outline-none resize-none leading-relaxed"
          />
        </div>

        {/* 图片上传 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-text-muted mb-3">添加图片（最多 9 张，选填）</p>
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
                  // 模拟添加示例图片
                  setImages((prev) => [
                    ...prev,
                    `https://images.unsplash.com/photo-150094214${prev.length}?w=160&h=160&fit=crop`,
                  ]);
                }}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-border-primary flex flex-col items-center justify-center gap-1 text-text-muted hover:border-[#0d9488] hover:text-[#0d9488] transition-colors"
              >
                <ImagePlus size={20} />
                <span className="text-xs">添加</span>
              </button>
            )}
          </div>
        </div>

        {/* 位置 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-text-muted mb-2">发布位置（选填）</p>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="如：Guelph, ON"
            className="w-full bg-transparent text-sm text-text-primary dark:text-white placeholder-text-muted outline-none"
          />
        </div>

        {/* 发帖须知 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
          <p className="font-semibold mb-1.5">📋 发帖须知</p>
          <p>• 请勿发布违法、歧视或骚扰性内容</p>
          <p>• 广告/促销帖请选择对应分类</p>
          <p>• 转发他人内容请注明来源</p>
          <p>• 违规内容将被删除，严重情况封号处理</p>
        </div>
      </div>

      {/* 底部固定发布按钮（移动端） */}
      <div className="fixed bottom-16 md:hidden left-0 right-0 bg-white dark:bg-[#2d2d30] border-t border-border-primary px-4 py-3 z-40">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
            canSubmit && !submitting
              ? 'bg-[#0d9488] text-white hover:bg-[#0a7c71]'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Send size={15} />
          {submitting ? '发布中...' : canSubmit ? '发布帖子' : '请填写标题、内容和分类'}
        </button>
      </div>
    </div>
  );
}
