'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2 } from 'lucide-react';

interface AIConfig {
  contentPassRule: string;
  newsCategoryConfig: string;
  newsCategoryDetail: string;
  cityList: string;
  contentRequirement: string;
  commentRequirement: string;
  articleCommentLength: string;
  videoCommentLength: string;
  analysisLength: string;
  aiModel: string;
  temperature: number;
  topP: number;
}

const AI_MODELS = [
  {
    group: '⚡ 高性能模型（高成本）',
    models: [
      { id: 'gpt-4o',        name: 'GPT-4o',          desc: '最强大，准确率最高 (~$5/1M tokens)' },
      { id: 'claude-3-opus', name: 'Claude 3 Opus',   desc: '多模态，性能卓越' },
    ],
  },
  {
    group: '⚖️ 均衡模型（推荐）',
    models: [
      { id: 'gpt-4o-mini',      name: 'GPT-4o Mini',       desc: '平衡性能和成本，推荐 (~$0.15/1M tokens)', recommended: true },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', desc: '快速、高性价比多模态模型' },
    ],
  },
  {
    group: '💰 经济型模型（国产，最便宜）',
    models: [
      { id: 'deepseek-v3', name: 'DeepSeek-V3',    desc: '开源高性能，成本极低 (~$0.27/1M tokens)，中文优化' },
      { id: 'qwen-plus',   name: '阿里 Qwen Plus', desc: '通义千问，中文能力强，价格低廉' },
    ],
  },
];

export default function AIConfigPage() {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState<{ ok: boolean; text: string } | null>(null);

  const [cfg, setCfg] = useState<AIConfig>({
    contentPassRule: '',
    newsCategoryConfig: '',
    newsCategoryDetail: '',
    cityList: '',
    contentRequirement: '',
    commentRequirement: '',
    articleCommentLength: '300-500字',
    videoCommentLength: '150-250字',
    analysisLength: '800-1000字',
    aiModel: 'gpt-4o-mini',
    temperature: 0.7,
    topP: 0.9,
  });

  // ── Load config on mount ──────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/ai-config')
      .then((r) => r.json())
      .then((data) => { if (data.success) setCfg(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof AIConfig) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setCfg((prev) => ({ ...prev, [key]: e.target.value }));

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res  = await fetch('/api/admin/ai-config', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(cfg),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMsg({ ok: true, text: '配置已保存 ✓' });
      } else {
        setSaveMsg({ ok: false, text: data.error ?? '保存失败' });
      }
    } catch {
      setSaveMsg({ ok: false, text: '网络错误，保存失败' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  const labelClass    = 'block text-sm font-medium text-text-primary mb-2';
  const textareaClass = 'w-full px-3 py-2.5 text-sm border border-card-border rounded-lg bg-background text-text-primary outline-none focus:ring-2 focus:ring-[#0d9488]/40 font-mono text-xs resize-none';
  const inputClass    = 'w-full px-3 py-2 text-sm border border-card-border rounded-lg bg-background text-text-primary outline-none focus:ring-2 focus:ring-[#0d9488]/40';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-[#0d9488]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">AI 配置</h1>
          <p className="text-text-secondary mt-1">配置 AI 相关的系统规则和参数</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-70 ${
            saveMsg?.ok
              ? 'bg-green-500 text-white'
              : saveMsg && !saveMsg.ok
              ? 'bg-red-500 text-white'
              : 'bg-[#0d9488] text-white hover:bg-[#0a7c71]'
          }`}
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? '保存中…' : saveMsg?.text ?? '保存配置'}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex gap-3">
        <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">AI 配置影响系统生成和审核规则</p>
          <p className="text-xs text-blue-700 mt-1">请仔细配置，确保内容质量和合规性</p>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-6 space-y-8">

        {/* 内容过滤规则 */}
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-4">
            🚫 内容过滤规则
          </h2>
          <p className="text-xs text-text-secondary mb-2">AI 合成内容过滤以下指定内容，每行一条规则</p>
          <textarea
            rows={5}
            className={textareaClass}
            value={cfg.contentPassRule}
            onChange={set('contentPassRule')}
            placeholder="每行一条过滤规则，例如：色情内容、暴力内容..."
          />
        </div>

        {/* 新闻分类配置 */}
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-4">
            📰 新闻分类配置
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>分类名称（每行一个）</label>
              <textarea rows={4} className={textareaClass} value={cfg.newsCategoryConfig} onChange={set('newsCategoryConfig')} />
            </div>
            <div>
              <label className={labelClass}>分类详细描述</label>
              <textarea rows={5} className={textareaClass} value={cfg.newsCategoryDetail} onChange={set('newsCategoryDetail')} />
            </div>
            <div>
              <label className={labelClass}>加拿大城市列表（用于本地新闻推荐）</label>
              <textarea rows={4} className={textareaClass} value={cfg.cityList} onChange={set('cityList')} />
            </div>
          </div>
        </div>

        {/* 内容生成要求 */}
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-4">
            📋 内容生成要求
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>文章内容要求</label>
              <textarea rows={3} className={textareaClass} value={cfg.contentRequirement} onChange={set('contentRequirement')} placeholder="例如：80-150字，涵盖核心内容，客观中立…" />
            </div>
            <div>
              <label className={labelClass}>评论内容要求</label>
              <textarea rows={3} className={textareaClass} value={cfg.commentRequirement} onChange={set('commentRequirement')} placeholder="例如：有深度有趣，结合时事，引发思考…" />
            </div>
          </div>
        </div>

        {/* 字数要求 */}
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-4">
            🔤 评论字数要求
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'articleCommentLength' as const, label: '文章评论', placeholder: '300-500字' },
              { key: 'videoCommentLength'   as const, label: '视频评论', placeholder: '150-250字' },
              { key: 'analysisLength'       as const, label: '深度分析', placeholder: '800-1000字' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="p-4 border border-card-border rounded-lg">
                <label className="text-xs font-medium text-text-secondary mb-2 block">{label}</label>
                <input type="text" placeholder={placeholder} className={inputClass} value={cfg[key]} onChange={set(key)} />
              </div>
            ))}
          </div>
        </div>

        {/* AI 模型选择 */}
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-4">
            🤖 AI 模型选择
          </h2>
          <div className="space-y-5">
            {AI_MODELS.map((group) => (
              <div key={group.group}>
                <h3 className="text-sm font-semibold text-text-primary mb-3">{group.group}</h3>
                <div className="space-y-2">
                  {group.models.map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        cfg.aiModel === m.id
                          ? 'border-[#0d9488] bg-teal-50'
                          : 'border-card-border hover:border-[#0d9488]/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="ai-model"
                        value={m.id}
                        checked={cfg.aiModel === m.id}
                        onChange={() => setCfg((p) => ({ ...p, aiModel: m.id }))}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                          {m.name}
                          {'recommended' in m && m.recommended && (
                            <span className="text-xs bg-teal-100 text-[#0d9488] px-2 py-0.5 rounded-full font-medium">推荐</span>
                          )}
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">{m.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI 采样参数 */}
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-4">
            ⚙️ AI 采样参数
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>
                Temperature（创意度）
                <span className="ml-2 text-[#0d9488] font-bold">{cfg.temperature.toFixed(1)}</span>
              </label>
              <input
                type="range" min="0" max="2" step="0.1"
                value={cfg.temperature}
                onChange={(e) => setCfg((p) => ({ ...p, temperature: parseFloat(e.target.value) }))}
                className="w-full accent-[#0d9488]"
              />
              <p className="text-xs text-text-muted mt-1">较低（0.0）= 确定性；较高（1.0+）= 创意性</p>
            </div>
            <div>
              <label className={labelClass}>
                Top P（多样性）
                <span className="ml-2 text-[#0d9488] font-bold">{cfg.topP.toFixed(2)}</span>
              </label>
              <input
                type="range" min="0" max="1" step="0.05"
                value={cfg.topP}
                onChange={(e) => setCfg((p) => ({ ...p, topP: parseFloat(e.target.value) }))}
                className="w-full accent-[#0d9488]"
              />
              <p className="text-xs text-text-muted mt-1">控制生成文本的多样性</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
