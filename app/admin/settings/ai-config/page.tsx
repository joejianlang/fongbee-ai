'use client';

import { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function AIConfigPage() {
  const [saved, setSaved] = useState(false);

  // AI 配置状态
  const [contentPassRule, setContentPassRule] = useState(
    '每行一条过滤规则...\n'
  );
  const [newsCategoryConfig, setNewsCategoryConfig] = useState(
    '分类名称（每行一个）\n本地\n热点\n政治\n科技...'
  );
  const [newsCategoryDetail, setNewsCategoryDetail] = useState(
    '1. 本地：描述当地美国市...\n2. 热点：突发事件...'
  );
  const [cityList, setCityList] = useState(
    '加拿大城市列表（用于本地新闻推荐）\nOntario: Toronto, Mississauga...\nBC: Vancouver, Richmond...'
  );
  const [contentRequirement, setContentRequirement] = useState(
    '例如：80-150字，融括核心内容...'
  );
  const [commentRequirement, setCommentRequirement] = useState(
    '例如：副教副利，有深度有趣誓...'
  );

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const labelClass = 'block text-sm font-medium text-text-primary mb-2';
  const textareaClass = 'w-full px-3 py-2.5 text-sm border border-card-border rounded-lg bg-background text-text-primary outline-none focus:ring-2 focus:ring-[#0d9488]/40 font-mono text-xs resize-none';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">AI 配置</h1>
          <p className="text-text-secondary mt-1">配置 AI 相关的系统规则和参数</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-[#0d9488] text-white hover:bg-[#0a7c71]'
          }`}
        >
          <Save size={15} />
          {saved ? '已保存 ✓' : '保存配置'}
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
            value={contentPassRule}
            onChange={(e) => setContentPassRule(e.target.value)}
            placeholder="每行一条过滤规则..."
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
              <textarea
                rows={4}
                className={textareaClass}
                value={newsCategoryConfig}
                onChange={(e) => setNewsCategoryConfig(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>分类详细描述</label>
              <textarea
                rows={4}
                className={textareaClass}
                value={newsCategoryDetail}
                onChange={(e) => setNewsCategoryDetail(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>加拿大城市列表（用于本地新闻推荐）</label>
              <textarea
                rows={4}
                className={textareaClass}
                value={cityList}
                onChange={(e) => setCityList(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 内容要求配置 */}
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-4">
            📋 内容生成要求
          </h2>
          <p className="text-xs text-text-secondary mb-3">定义 AI 新闻生成内容的要求</p>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>文章内容要求</label>
              <textarea
                rows={3}
                className={textareaClass}
                value={contentRequirement}
                onChange={(e) => setContentRequirement(e.target.value)}
                placeholder="例如：80-150字，融括核心内容..."
              />
            </div>

            <div>
              <label className={labelClass}>评论内容要求</label>
              <textarea
                rows={3}
                className={textareaClass}
                value={commentRequirement}
                onChange={(e) => setCommentRequirement(e.target.value)}
                placeholder="例如：副教副利，有深度有趣誓..."
              />
            </div>
          </div>
        </div>

        {/* 评论字数要求 */}
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-4">
            🔤 评论字数要求
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-card-border rounded-lg">
              <label className="text-xs font-medium text-text-secondary mb-2 block">文章评论</label>
              <input
                type="text"
                placeholder="300-500字"
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg bg-background text-text-primary outline-none focus:ring-2 focus:ring-[#0d9488]/40"
                defaultValue="300-500字"
              />
            </div>

            <div className="p-4 border border-card-border rounded-lg">
              <label className="text-xs font-medium text-text-secondary mb-2 block">视频评论</label>
              <input
                type="text"
                placeholder="150-250字"
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg bg-background text-text-primary outline-none focus:ring-2 focus:ring-[#0d9488]/40"
                defaultValue="150-250字"
              />
            </div>

            <div className="p-4 border border-card-border rounded-lg">
              <label className="text-xs font-medium text-text-secondary mb-2 block">深度分析</label>
              <input
                type="text"
                placeholder="800-1000字"
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg bg-background text-text-primary outline-none focus:ring-2 focus:ring-[#0d9488]/40"
                defaultValue="800-1000字"
              />
            </div>
          </div>
        </div>

        {/* AI 模型选择 */}
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-4">
            🤖 AI 模型选择
          </h2>

          <div className="space-y-3">
            {[
              { id: 'model1', name: 'GPT-4', description: '最强大的模型，准确率最高但成本较高' },
              { id: 'model2', name: 'GPT-3.5 Turbo', description: '平衡性能和成本，推荐使用' },
              { id: 'model3', name: 'Claude 3', description: '多模态模型，可处理文本和图像' },
            ].map((model) => (
              <label key={model.id} className="flex items-start gap-3 p-3 border border-card-border rounded-lg cursor-pointer hover:bg-card-border/50 transition-colors">
                <input
                  type="radio"
                  name="ai-model"
                  value={model.id}
                  defaultChecked={model.id === 'model2'}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{model.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{model.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 温度和采样参数 */}
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-4">
            ⚙️ AI 采样参数
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Temperature（创意度）</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  defaultValue="0.7"
                  className="flex-1"
                />
                <span className="text-sm font-medium text-text-primary min-w-12 text-right">0.7</span>
              </div>
              <p className="text-xs text-text-muted mt-1">较低（0.0）= 确定性；较高（1.0+）= 创意性</p>
            </div>

            <div>
              <label className={labelClass}>Top P（多样性）</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  defaultValue="0.9"
                  className="flex-1"
                />
                <span className="text-sm font-medium text-text-primary min-w-12 text-right">0.9</span>
              </div>
              <p className="text-xs text-text-muted mt-1">控制生成文本的多样性</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
