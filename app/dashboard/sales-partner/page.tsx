'use client';

import { useState, useEffect } from 'react';
import { Link2, Copy, Mail, Settings, Check } from 'lucide-react';

type LinkType   = 'provider' | 'user';
type InviteType = 'provider' | 'user';

interface PartnerData {
  referralCode: string;
  providerLink: string;
  userLink:     string;
  stats: {
    totalProviders:  number;
    monthlyEarnings: number;
    pendingPayout:   number;
  };
}

export default function SalesPartnerOverview() {
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [linkType,    setLinkType]    = useState<LinkType>('provider');
  const [inviteType,  setInviteType]  = useState<InviteType>('provider');
  const [inviteInput, setInviteInput] = useState('');
  const [copied,      setCopied]      = useState(false);
  const [sending,     setSending]     = useState(false);

  // Promo settings
  const [giftPoints,   setGiftPoints]   = useState(true);
  const [autoApprove,  setAutoApprove]  = useState(false);
  const [emailNotify,  setEmailNotify]  = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/sales-partner/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPartnerData(d.data);
      })
      .catch(() => {/* stay with null, fall through to defaults */})
      .finally(() => setLoadingData(false));
  }, []);

  // Fallback defaults while loading or if not a sales partner
  const displayCode    = partnerData?.referralCode  ?? '——';
  const displayProvider = partnerData?.providerLink ?? '—';
  const displayUser    = partnerData?.userLink      ?? '—';

  const currentLink = linkType === 'provider' ? displayProvider : displayUser;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    if (!inviteInput) return;
    setSending(true);
    // TODO: Wire to email invite API
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    setInviteInput('');
  };

  return (
    <div className="px-4 py-5 space-y-4">

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {loadingData ? (
          [1,2,3].map((i) => (
            <div key={i} className="bg-[#1a2332] rounded-2xl p-4 text-center animate-pulse">
              <div className="h-6 w-12 bg-gray-700 rounded mx-auto mb-2" />
              <div className="h-3 w-16 bg-gray-700 rounded mx-auto" />
            </div>
          ))
        ) : (
          [
            { label: '累计服务商', value: String(partnerData?.stats.totalProviders ?? 0),   color: 'text-[#0d9488]' },
            { label: '本月收益',   value: `$${partnerData?.stats.monthlyEarnings ?? 0}`,    color: 'text-[#0d9488]' },
            { label: '待结算',     value: `$${partnerData?.stats.pendingPayout   ?? 0}`,    color: 'text-orange-400' },
          ].map((s) => (
            <div key={s.label} className="bg-[#1a2332] rounded-2xl p-4 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
            </div>
          ))
        )}
      </div>

      {/* Referral Link Card */}
      <div className="bg-[#1a2332] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Link2 size={18} className="text-[#0d9488]" />
          <span className="text-gray-200 text-sm font-semibold">推广链接</span>
        </div>

        {/* Sub-tabs */}
        <div className="flex bg-[#253344] rounded-xl p-1 mb-4">
          <button
            onClick={() => setLinkType('provider')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              linkType === 'provider' ? 'bg-[#0d9488] text-white' : 'text-gray-400'
            }`}
          >
            服务商
          </button>
          <button
            onClick={() => setLinkType('user')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              linkType === 'user' ? 'bg-[#0d9488] text-white' : 'text-gray-400'
            }`}
          >
            用户
          </button>
        </div>

        {/* Link Box */}
        <div className="bg-[#253344] rounded-xl p-3 mb-3 break-all">
          <p className="text-gray-300 text-xs leading-relaxed font-mono">{currentLink}</p>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 py-3 border border-gray-600 rounded-xl text-sm font-medium transition-all hover:border-[#0d9488] hover:text-[#0d9488]"
        >
          {copied ? (
            <>
              <Check size={16} className="text-[#0d9488]" />
              <span className="text-[#0d9488]">已复制！</span>
            </>
          ) : (
            <>
              <Copy size={16} className="text-gray-300" />
              <span className="text-gray-300">复制链接</span>
            </>
          )}
        </button>

        {/* Invite Code */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
          <span className="text-gray-400 text-sm">邀请码：</span>
          {loadingData ? (
            <div className="h-6 w-24 bg-gray-700 rounded animate-pulse" />
          ) : (
            <span className="text-white text-lg font-bold tracking-widest">
              {displayCode}
            </span>
          )}
        </div>
      </div>

      {/* Send Invite Card */}
      <div className="bg-[#1a2332] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Mail size={18} className="text-[#0d9488]" />
          <span className="text-gray-200 text-sm font-semibold">发送邀请</span>
        </div>

        {/* Sub-tabs */}
        <div className="flex bg-[#253344] rounded-xl p-1 mb-4">
          <button
            onClick={() => setInviteType('provider')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              inviteType === 'provider' ? 'bg-[#0d9488] text-white' : 'text-gray-400'
            }`}
          >
            邀请服务商
          </button>
          <button
            onClick={() => setInviteType('user')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              inviteType === 'user' ? 'bg-[#0d9488] text-white' : 'text-gray-400'
            }`}
          >
            邀请用户
          </button>
        </div>

        {/* Input + Send */}
        <div className="flex gap-3">
          <input
            type="text"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            placeholder={inviteType === 'provider' ? '服务商邮箱或手机号' : '用户邮箱或手机号'}
            className="flex-1 bg-[#253344] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-[#0d9488]"
          />
          <button
            onClick={handleSend}
            disabled={sending || !inviteInput}
            className="px-5 py-3 bg-[#0d9488] text-white text-sm font-semibold rounded-xl hover:bg-[#0a7c71] transition-all disabled:opacity-50"
          >
            {sending ? '发送中' : '发送'}
          </button>
        </div>
      </div>

      {/* Promo Settings Card */}
      <div className="bg-[#1a2332] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Settings size={18} className="text-[#0d9488]" />
          <span className="text-gray-200 text-sm font-semibold">推广策略配置</span>
        </div>

        <div className="space-y-5">
          {[
            {
              label: '赠送新用户积分 (50分)',
              desc: '开启后，新用户通过您的链接注册将获得50积分。',
              value: giftPoints,
              onChange: setGiftPoints,
            },
            {
              label: '自动审批服务商',
              desc: '通过您的邀请链接注册的服务商无需等待人工审批。',
              value: autoApprove,
              onChange: setAutoApprove,
            },
            {
              label: '新注册邮件通知',
              desc: '每当有人通过您的链接注册时，通知您的邮箱。',
              value: emailNotify,
              onChange: setEmailNotify,
            },
          ].map((item) => (
            <div key={item.label} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-gray-200 text-sm font-medium">{item.label}</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
              <button
                onClick={() => item.onChange(!item.value)}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                  item.value ? 'bg-[#0d9488]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    item.value ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
