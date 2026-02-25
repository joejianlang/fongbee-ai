'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ImagePlus, X, ChevronDown, CheckCircle,
  Calendar, DollarSign, MapPin, Info,
} from 'lucide-react';

const SERVICE_CATEGORIES = [
  '家居清洁', '教育辅导', '搬家运输', '园艺绿化',
  '财税咨询', '房屋维修', '摄影摄像', '翻译口译',
  '美容美发', '宠物服务', '餐饮外卖', '其他',
];

const BUDGET_OPTIONS = [
  '不限预算', '$50 以内', '$50–$150', '$150–$500',
  '$500–$1,000', '$1,000–$3,000', '$3,000 以上',
];

const TIMELINE_OPTIONS = [
  '尽快（1–3天内）', '本周内', '两周内', '一个月内', '时间灵活',
];

export default function CustomServicePage() {
  const router = useRouter();

  const [category,   setCategory]   = useState('');
  const [title,      setTitle]      = useState('');
  const [description,setDescription]= useState('');
  const [budget,     setBudget]     = useState('');
  const [timeline,   setTimeline]   = useState('');
  const [address,    setAddress]    = useState('');
  const [contact,    setContact]    = useState('');
  const [images,     setImages]     = useState<string[]>([]);
  const [showCatMenu,setShowCatMenu]= useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const canSubmit = category && title.trim() && description.trim() && budget && contact.trim();

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => router.push('/services'), 1500);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#0d9488]/10 flex items-center justify-center mb-5">
          <CheckCircle size={42} className="text-[#0d9488]" />
        </div>
        <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">需求发布成功！</h2>
        <p className="text-sm text-text-muted mb-1">我们已收到您的定制需求</p>
        <p className="text-sm text-text-muted">平台将在 <span className="text-[#0d9488] font-semibold">24 小时内</span> 为您匹配合适的服务商</p>
        <p className="text-xs text-text-muted mt-3">正在返回服务页面...</p>
      </div>
    );
  }

  return (
    <div className="pb-36 md:pb-10">
      {/* 顶部导航 */}
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center justify-between">
        <Link
          href="/services"
          className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors"
        >
          <ArrowLeft size={18} />
          取消
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">发布定制需求</span>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all ${
            canSubmit && !submitting
              ? 'bg-[#0d9488] text-white hover:bg-[#0a7c71]'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {submitting ? '提交中…' : '提交'}
        </button>
      </div>

      {/* 说明横幅 */}
      <div className="bg-[#0d9488]/10 border-b border-[#0d9488]/20 px-4 py-3 flex gap-2">
        <Info size={15} className="text-[#0d9488] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#0d9488] leading-relaxed">
          找不到合适的服务？告诉我们您的需求，平台将主动为您匹配专业服务商，收到报价后再决定是否预约。
        </p>
      </div>

      <div className="px-4 md:px-0 mt-4 space-y-4">

        {/* 服务类别 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-text-muted mb-3">
            服务类别 <span className="text-red-400">*</span>
          </p>
          <div className="relative">
            <button
              onClick={() => setShowCatMenu(!showCatMenu)}
              className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm transition-colors ${
                category ? 'border-[#0d9488] text-text-primary dark:text-white' : 'border-border-primary text-text-muted'
              }`}
            >
              <span>{category || '请选择服务类别'}</span>
              <ChevronDown size={16} className={`transition-transform ${showCatMenu ? 'rotate-180' : ''}`} />
            </button>
            {showCatMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2d2d30] border border-border-primary rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="flex flex-wrap gap-1.5 p-3">
                  {SERVICE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setCategory(cat); setShowCatMenu(false); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        category === cat
                          ? 'bg-[#0d9488] text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-[#0d9488]/10 hover:text-[#0d9488]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 需求标题 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-text-muted mb-2">
            需求标题 <span className="text-red-400">*</span>
            <span className="ml-1 font-normal text-text-muted/60">（{title.length}/60）</span>
          </p>
          <input
            type="text"
            maxLength={60}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="用一句话概括您的需求，如：三居室深度清洁 + 冰箱除霜"
            className="w-full bg-transparent text-sm text-text-primary dark:text-white placeholder-text-muted outline-none"
          />
        </div>

        {/* 详细描述 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-text-muted mb-2">
            详细描述 <span className="text-red-400">*</span>
            <span className="ml-1 font-normal text-text-muted/60">（{description.length}/1000）</span>
          </p>
          <textarea
            maxLength={1000}
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请详细描述您的需求，包括：
• 具体需要做什么
• 房间/场地大小
• 是否有特殊要求或注意事项
• 是否需要自备材料/工具

描述越详细，越容易匹配到合适的服务商 ✨"
            className="w-full bg-transparent text-sm text-text-primary dark:text-white placeholder-text-muted outline-none resize-none leading-relaxed"
          />
        </div>

        {/* 预算 & 时间 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4 space-y-4">
          {/* 预算 */}
          <div>
            <p className="text-xs font-semibold text-text-muted mb-2 flex items-center gap-1">
              <DollarSign size={13} className="text-[#0d9488]" />
              预算范围 <span className="text-red-400">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setBudget(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    budget === opt
                      ? 'bg-[#0d9488] text-white border-[#0d9488]'
                      : 'border-border-primary text-text-secondary hover:border-[#0d9488]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* 期望完成时间 */}
          <div>
            <p className="text-xs font-semibold text-text-muted mb-2 flex items-center gap-1">
              <Calendar size={13} className="text-[#0d9488]" />
              期望完成时间（选填）
            </p>
            <div className="flex flex-wrap gap-2">
              {TIMELINE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setTimeline(timeline === opt ? '' : opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    timeline === opt
                      ? 'bg-[#0d9488] text-white border-[#0d9488]'
                      : 'border-border-primary text-text-secondary hover:border-[#0d9488]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 服务地址 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-text-muted mb-2 flex items-center gap-1">
            <MapPin size={13} className="text-[#0d9488]" />
            服务地址（选填，仅显示城市给服务商）
          </p>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="如：Guelph, ON 或 123 Gordon St, Guelph"
            className="w-full bg-transparent text-sm text-text-primary dark:text-white placeholder-text-muted outline-none"
          />
        </div>

        {/* 图片 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-text-muted mb-3">参考图片（选填，最多 6 张）</p>
          <p className="text-xs text-text-muted mb-3">如有参考样式或需要处理的问题照片，可以上传帮助服务商更好理解需求</p>
          <div className="flex flex-wrap gap-2">
            {images.map((_, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div className="w-full h-full bg-[#0d9488]/10 flex items-center justify-center">
                  <ImagePlus size={20} className="text-[#0d9488]/50" />
                </div>
                <button
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
            {images.length < 6 && (
              <button
                onClick={() => setImages((prev) => [...prev, ''])}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-border-primary flex flex-col items-center justify-center gap-1 text-text-muted hover:border-[#0d9488] hover:text-[#0d9488] transition-colors"
              >
                <ImagePlus size={20} />
                <span className="text-xs">上传</span>
              </button>
            )}
          </div>
        </div>

        {/* 联系方式 */}
        <div className="bg-white dark:bg-[#2d2d30] rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-text-muted mb-2">
            联系方式 <span className="text-red-400">*</span>
          </p>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="手机号或邮箱，服务商匹配后会与您联系"
            className="w-full bg-transparent text-sm text-text-primary dark:text-white placeholder-text-muted outline-none"
          />
          <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
            <Info size={11} />
            联系方式仅对平台匹配的服务商可见
          </p>
        </div>

        {/* 提示说明 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <p className="font-semibold mb-1.5">💡 定制需求流程</p>
          <p>① 填写并提交您的需求</p>
          <p>② 平台在 24 小时内为您匹配 1–3 位服务商</p>
          <p>③ 服务商主动联系您并报价</p>
          <p>④ 您选择满意的服务商，在线预约并付款</p>
        </div>
      </div>

      {/* 底部提交按钮（移动端固定） */}
      <div className="fixed bottom-16 md:hidden left-0 right-0 bg-white dark:bg-[#2d2d30] border-t border-border-primary px-4 py-3 z-40">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
            canSubmit && !submitting
              ? 'bg-[#0d9488] text-white hover:bg-[#0a7c71]'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {submitting ? '提交中...' : canSubmit ? '提交定制需求' : '请填写必填项（标题、描述、类别、预算、联系方式）'}
        </button>
      </div>
    </div>
  );
}
