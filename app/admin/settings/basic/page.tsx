'use client';

import { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function BasicSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [platformName, setPlatformName] = useState('优服佳');
  const [platformSlogan, setPlatformSlogan] = useState('您身边的服务专家');
  const [defaultCity, setDefaultCity] = useState('多伦多');
  const [platformFee, setPlatformFee] = useState('10');
  const [maxBookDays, setMaxBookDays] = useState('90');
  const [supportEmail, setSupportEmail] = useState('support@youfujia.ca');
  const [supportPhone, setSupportPhone] = useState('+1-416-555-0000');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass = 'w-full px-3 py-2.5 text-sm border border-card-border rounded-lg bg-background text-text-primary outline-none focus:ring-2 focus:ring-[#0d9488]/40 transition-colors';
  const labelClass = 'block text-sm font-medium text-text-primary mb-1.5';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">基本设置</h1>
          <p className="text-text-secondary mt-1">配置平台基础信息</p>
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex gap-3">
        <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">基本设置影响整个平台</p>
          <p className="text-xs text-blue-700 mt-1">请仔细修改，确保信息准确无误</p>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-6 space-y-6">
        {/* Platform Info */}
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-6">平台信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>平台名称</label>
              <input className={inputClass} value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>平台口号</label>
              <input className={inputClass} value={platformSlogan} onChange={(e) => setPlatformSlogan(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>默认城市</label>
              <input className={inputClass} value={defaultCity} onChange={(e) => setDefaultCity(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>支持语言</label>
              <select className={inputClass}>
                <option>中文 (简体)</option>
                <option>中文 (繁體)</option>
                <option>English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Platform Fees */}
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-6">费用配置</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>平台手续费率 (%)</label>
              <input
                className={inputClass}
                type="number"
                min="0"
                max="50"
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
              />
              <p className="text-xs text-text-muted mt-1">每笔订单抽取 {platformFee}% 的手续费</p>
            </div>
            <div>
              <label className={labelClass}>最大可预约天数</label>
              <input
                className={inputClass}
                type="number"
                min="1"
                max="365"
                value={maxBookDays}
                onChange={(e) => setMaxBookDays(e.target.value)}
              />
              <p className="text-xs text-text-muted mt-1">用户可提前 {maxBookDays} 天预约服务</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-6">联系信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>支持邮箱</label>
              <input
                className={inputClass}
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>支持电话</label>
              <input className={inputClass} value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Platform Description */}
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-6">平台介绍</h2>
          <div>
            <label className={labelClass}>平台简介</label>
            <textarea
              rows={4}
              className={inputClass + ' resize-none'}
              defaultValue="优服佳是服务于大多伦多地区华人社区的本地生活服务平台，连接用户与服务商，提供优质的家政、维修、搬家等多种服务。"
            />
            <p className="text-xs text-text-muted mt-1">此简介将显示在平台首页</p>
          </div>
        </div>

        {/* Timezone & Locale */}
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-6">地区和时区</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>时区</label>
              <select className={inputClass}>
                <option>America/Toronto (EST)</option>
                <option>America/Vancouver (PST)</option>
                <option>America/Edmonton (MST)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>日期格式</label>
              <select className={inputClass}>
                <option>YYYY-MM-DD</option>
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
