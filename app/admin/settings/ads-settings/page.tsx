'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

export default function AdsSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [maxAdsPerPage, setMaxAdsPerPage] = useState('5');
  const [adsRotationInterval, setAdsRotationInterval] = useState('10');
  const [enableAdTracking, setEnableAdTracking] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass = 'w-full px-3 py-2.5 text-sm border border-card-border rounded-lg bg-background text-text-primary outline-none focus:ring-2 focus:ring-[#0d9488]/40';
  const labelClass = 'block text-sm font-medium text-text-primary mb-1.5';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">广告设置</h1>
          <p className="text-text-secondary mt-1">管理平台广告展示规则</p>
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
          {saved ? '已保存 ✓' : '保存设置'}
        </button>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-6">广告显示</h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>每页最多广告数</label>
              <input
                className={inputClass}
                type="number"
                min="1"
                max="10"
                value={maxAdsPerPage}
                onChange={(e) => setMaxAdsPerPage(e.target.value)}
              />
              <p className="text-xs text-text-muted mt-1">控制单页面显示的广告数量</p>
            </div>

            <div>
              <label className={labelClass}>广告轮换间隔 (秒)</label>
              <input
                className={inputClass}
                type="number"
                min="5"
                max="60"
                value={adsRotationInterval}
                onChange={(e) => setAdsRotationInterval(e.target.value)}
              />
              <p className="text-xs text-text-muted mt-1">广告自动轮换的时间间隔</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-6">数据跟踪</h2>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">启用广告追踪</p>
              <p className="text-xs text-text-muted mt-0.5">记录广告点击和展示数据</p>
            </div>
            <button
              onClick={() => setEnableAdTracking(!enableAdTracking)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                enableAdTracking ? 'bg-[#0d9488]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  enableAdTracking ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-6">广告位置</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: '首页顶部', enabled: true },
              { label: '首页底部', enabled: true },
              { label: '搜索结果页', enabled: false },
              { label: '详情页侧边栏', enabled: true },
            ].map((pos) => (
              <div key={pos.label} className="flex items-center justify-between p-3 border border-card-border rounded-lg">
                <span className="text-sm text-text-primary font-medium">{pos.label}</span>
                <div
                  className={`w-5 h-5 rounded border ${
                    pos.enabled ? 'bg-[#0d9488] border-[#0d9488]' : 'border-card-border'
                  } flex items-center justify-center`}
                >
                  {pos.enabled && <span className="text-white text-xs">✓</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
