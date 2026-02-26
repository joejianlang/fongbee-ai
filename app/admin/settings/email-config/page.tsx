'use client';

import { useState } from 'react';
import { Save, Mail, AlertCircle } from 'lucide-react';

export default function EmailConfigPage() {
  const [saved, setSaved] = useState(false);
  const [smtpHost, setSmtpHost] = useState('smtp.sendgrid.net');
  const [smtpPort, setSmtpPort] = useState('587');
  const [senderEmail, setSenderEmail] = useState('no-reply@youfujia.ca');
  const [senderName, setSenderName] = useState('优服佳');
  const [username, setUsername] = useState('apikey');

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
          <h1 className="text-3xl font-bold text-text-primary">邮件配置</h1>
          <p className="text-text-secondary mt-1">配置邮件服务和发送参数</p>
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
          <p className="text-sm font-medium text-yellow-800">请谨慎配置邮件服务</p>
          <p className="text-xs text-yellow-700 mt-1">不正确的配置可能导致邮件无法发送</p>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-6">SMTP 服务器</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>SMTP 主机</label>
              <input className={inputClass} value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>SMTP 端口</label>
              <input className={inputClass} type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>用户名</label>
              <input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>密码</label>
              <input className={inputClass} type="password" placeholder="••••••••" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-6">发件人信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>发件人邮箱</label>
              <input className={inputClass} type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>发件人名称</label>
              <input className={inputClass} value={senderName} onChange={(e) => setSenderName(e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-text-primary border-b border-card-border pb-3 mb-6">测试邮件</h2>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="输入测试邮箱地址"
              className={inputClass + ' flex-1 max-w-sm'}
            />
            <button className="px-4 py-2.5 rounded-lg font-medium bg-[#0d9488]/10 text-[#0d9488] hover:bg-[#0d9488]/20 transition-colors">
              <Mail size={16} className="inline mr-2" />
              发送测试
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
