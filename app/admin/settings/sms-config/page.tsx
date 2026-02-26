'use client';

import { useState } from 'react';
import { Save, MessageSquare, AlertCircle } from 'lucide-react';

export default function SMSConfigPage() {
  const [saved, setSaved] = useState(false);
  const [accountSid, setAccountSid] = useState('AC••••••••••••••••••••');
  const [authToken, setAuthToken] = useState('••••••••••••••••••••');
  const [phoneNumber, setPhoneNumber] = useState('+1••••••••••');

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
          <h1 className="text-3xl font-bold text-text-primary">短信配置</h1>
          <p className="text-text-secondary mt-1">配置短信服务（Twilio）</p>
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

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex gap-3">
        <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-800">请从 Twilio 控制台获取凭证</p>
          <p className="text-xs text-yellow-700 mt-1">勿在此处输入真实密钥。应通过环境变量配置。</p>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-6">Twilio 凭证</h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Account SID</label>
              <input className={inputClass} value={accountSid} onChange={(e) => setAccountSid(e.target.value)} readOnly />
              <p className="text-xs text-text-muted mt-1">在 Twilio 控制台获取</p>
            </div>

            <div>
              <label className={labelClass}>Auth Token</label>
              <input className={inputClass} type="password" value={authToken} onChange={(e) => setAuthToken(e.target.value)} readOnly />
              <p className="text-xs text-text-muted mt-1">保密的身份验证令牌</p>
            </div>

            <div>
              <label className={labelClass}>发送电话号码</label>
              <input className={inputClass} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} readOnly />
              <p className="text-xs text-text-muted mt-1">Twilio 购买的电话号码（E.164 格式）</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-6">测试短信</h2>
          <div className="flex gap-3">
            <input
              type="tel"
              placeholder="输入接收者电话号码"
              className={inputClass + ' flex-1 max-w-sm'}
            />
            <button className="px-4 py-2.5 rounded-lg font-medium bg-[#0d9488]/10 text-[#0d9488] hover:bg-[#0d9488]/20 transition-colors">
              <MessageSquare size={16} className="inline mr-2" />
              发送测试
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-6">短信模板</h2>
          <div className="space-y-3">
            {[
              { name: '邀请链接', template: '{{invitationLink}}' },
              { name: '邀请代码', template: '{{invitationCode}}' },
              { name: '验证码', template: '{{verificationCode}}' },
            ].map((tmpl) => (
              <div key={tmpl.name} className="p-3 bg-background rounded-lg border border-card-border">
                <p className="text-xs font-medium text-text-secondary mb-1">{tmpl.name}</p>
                <p className="text-sm text-text-primary font-mono">{tmpl.template}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
