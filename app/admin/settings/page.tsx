'use client';

import { useState } from 'react';
import { Save, Globe, Bell, Shield, Database, Mail } from 'lucide-react';

interface SettingSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: SettingSection[] = [
  { id: 'general',       label: '基本设置',   icon: <Globe size={16} /> },
  { id: 'notifications', label: '通知设置',   icon: <Bell size={16} /> },
  { id: 'security',      label: '安全设置',   icon: <Shield size={16} /> },
  { id: 'payment',       label: '支付配置',   icon: <Database size={16} /> },
  { id: 'email',         label: '邮件设置',   icon: <Mail size={16} /> },
];

export default function SettingsPage() {
  const [active, setActive]   = useState('general');
  const [saved,  setSaved]    = useState(false);

  // General settings state
  const [siteName,    setSiteName]    = useState('数位 Buffet');
  const [siteCity,    setSiteCity]    = useState('Guelph');
  const [platformFee, setPlatformFee] = useState('10');
  const [maxBookDays, setMaxBookDays] = useState('90');

  // Notification settings
  const [emailOnOrder,    setEmailOnOrder]    = useState(true);
  const [emailOnCancel,   setEmailOnCancel]   = useState(true);
  const [smsOnOrder,      setSmsOnOrder]      = useState(false);
  const [pushEnabled,     setPushEnabled]     = useState(true);

  // Security settings
  const [twoFactor,       setTwoFactor]       = useState(false);
  const [sessionTimeout,  setSessionTimeout]  = useState('60');
  const [allowedOrigins,  setAllowedOrigins]  = useState('https://youfujia.ca');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass = "w-full px-3 py-2.5 text-sm border border-card-border rounded-lg bg-background text-text-primary outline-none focus:ring-2 focus:ring-[#0d9488]/40 transition-colors";
  const labelClass = "block text-sm font-medium text-text-primary mb-1.5";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">系统设置</h1>
          <p className="text-text-secondary mt-1">管理平台全局配置</p>
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
          {saved ? '已保存 ✓' : '保存更改'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Nav */}
        <aside className="w-48 flex-shrink-0 space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                active === s.id
                  ? 'bg-[#0d9488]/10 text-[#0d9488]'
                  : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </aside>

        {/* Content Panel */}
        <div className="flex-1 bg-card border border-card-border rounded-xl p-6 space-y-6">

          {/* General */}
          {active === 'general' && (
            <>
              <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3">基本设置</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>平台名称</label>
                  <input className={inputClass} value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>默认城市</label>
                  <input className={inputClass} value={siteCity} onChange={(e) => setSiteCity(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>平台手续费率 (%)</label>
                  <input className={inputClass} type="number" min="0" max="50" value={platformFee} onChange={(e) => setPlatformFee(e.target.value)} />
                  <p className="text-xs text-text-muted mt-1">当前设定：每笔订单抽取 {platformFee}%</p>
                </div>
                <div>
                  <label className={labelClass}>最大可预约天数</label>
                  <input className={inputClass} type="number" min="1" value={maxBookDays} onChange={(e) => setMaxBookDays(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>平台介绍 (简短)</label>
                <textarea
                  rows={3}
                  className={inputClass + ' resize-none'}
                  defaultValue="数位 Buffet 是服务于大多伦多地区华人社区的本地生活服务平台。"
                />
              </div>
            </>
          )}

          {/* Notifications */}
          {active === 'notifications' && (
            <>
              <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3">通知设置</h2>
              <div className="space-y-4">
                {[
                  { label: '新订单邮件通知', desc: '每当有新订单时发送邮件给管理员', value: emailOnOrder, set: setEmailOnOrder },
                  { label: '取消订单邮件通知', desc: '订单取消时通知相关方', value: emailOnCancel, set: setEmailOnCancel },
                  { label: '短信通知 (SMS)', desc: '通过 Twilio 发送关键订单短信', value: smsOnOrder, set: setSmsOnOrder },
                  { label: 'Web Push 通知', desc: '浏览器推送通知（PWA）', value: pushEnabled, set: setPushEnabled },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-card-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.label}</p>
                      <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => item.set(!item.value)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${item.value ? 'bg-[#0d9488]' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.value ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Security */}
          {active === 'security' && (
            <>
              <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3">安全设置</h2>
              <div className="space-y-5">
                <div className="flex items-center justify-between py-3 border-b border-card-border">
                  <div>
                    <p className="text-sm font-medium text-text-primary">双因素认证 (2FA)</p>
                    <p className="text-xs text-text-muted mt-0.5">对所有管理员账户启用 2FA</p>
                  </div>
                  <button
                    onClick={() => setTwoFactor(!twoFactor)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${twoFactor ? 'bg-[#0d9488]' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${twoFactor ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div>
                  <label className={labelClass}>Session 超时时间 (分钟)</label>
                  <input className={inputClass} type="number" min="15" value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>允许的来源域名 (CORS)</label>
                  <textarea rows={3} className={inputClass + ' resize-none font-mono text-xs'} value={allowedOrigins} onChange={(e) => setAllowedOrigins(e.target.value)} />
                  <p className="text-xs text-text-muted mt-1">每行一个域名</p>
                </div>
              </div>
            </>
          )}

          {/* Payment */}
          {active === 'payment' && (
            <>
              <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3">支付配置</h2>
              <div className="space-y-5">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700">
                  ⚠️ 支付密钥请在服务器环境变量中配置，不要在此处输入真实密钥。
                </div>
                <div>
                  <label className={labelClass}>Stripe Publishable Key</label>
                  <input className={inputClass + ' font-mono text-xs'} defaultValue="pk_live_••••••••••••••••" readOnly />
                </div>
                <div>
                  <label className={labelClass}>Stripe Secret Key</label>
                  <input className={inputClass + ' font-mono text-xs'} type="password" defaultValue="sk_live_hidden" readOnly />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Webhook Secret</label>
                    <input className={inputClass + ' font-mono text-xs'} type="password" defaultValue="whsec_hidden" readOnly />
                  </div>
                  <div>
                    <label className={labelClass}>支付货币</label>
                    <select className={inputClass}>
                      <option value="cad">CAD — 加拿大元</option>
                      <option value="usd">USD — 美元</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          {active === 'email' && (
            <>
              <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3">邮件设置</h2>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>SMTP 主机</label>
                    <input className={inputClass} defaultValue="smtp.resend.com" />
                  </div>
                  <div>
                    <label className={labelClass}>SMTP 端口</label>
                    <input className={inputClass} type="number" defaultValue="587" />
                  </div>
                  <div>
                    <label className={labelClass}>发件人邮箱</label>
                    <input className={inputClass} type="email" defaultValue="no-reply@youfujia.ca" />
                  </div>
                  <div>
                    <label className={labelClass}>发件人名称</label>
                    <input className={inputClass} defaultValue="数位 Buffet" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>订单确认邮件模板 (HTML)</label>
                  <textarea
                    rows={5}
                    className={inputClass + ' resize-y font-mono text-xs'}
                    defaultValue={`<h2>您的订单已确认 🎉</h2>\n<p>订单号：{{orderId}}</p>\n<p>服务商：{{providerName}}</p>\n<p>预约时间：{{appointmentTime}}</p>`}
                  />
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
