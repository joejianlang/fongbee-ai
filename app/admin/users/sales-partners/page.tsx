'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Send, TrendingUp, Users, Building, Copy, Check } from 'lucide-react';

interface SalesPartner {
  id: string;
  userId: string;
  email: string;
  name: string;
  companyName?: string;
  tier: string;
  status: string;
  referralCode: string;
  totalUsersInvited: number;
  totalProvidersInvited: number;
  weekUsersInvited: number;
  monthUsersInvited: number;
  createdAt: string;
}

const tierLabels: Record<string, string> = {
  BRONZE: '青铜级',
  SILVER: '白银级',
  GOLD: '黄金级',
};

const tierColors: Record<string, string> = {
  BRONZE: 'bg-amber-100 text-amber-700',
  SILVER: 'bg-gray-200 text-gray-700',
  GOLD: 'bg-yellow-100 text-yellow-700',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  ACTIVE: '活跃',
  INACTIVE: '非活跃',
  SUSPENDED: '暂停',
};

const inputCls =
  'w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-background text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40';

export default function SalesPartnersPage() {
  const [partners, setPartners] = useState<SalesPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState('');
  const [inviteForm, setInviteForm] = useState<{
    partnerId: string;
    email: string;
    phone: string;
    name: string;
    type: string;
  } | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    loadPartners();
  }, [tierFilter]);

  const loadPartners = async () => {
    try {
      let url = '/api/admin/sales-partners';
      const params = new URLSearchParams();
      if (tierFilter) params.append('tier', tierFilter);
      if (params.toString()) url += '?' + params.toString();

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPartners(data.data);
      }
    } catch (error) {
      console.error('Failed to load partners:', error);
    } finally {
      setLoading(false);
    }
  };


  const openInviteForm = (partnerId: string) => {
    setInviteForm({
      partnerId,
      email: '',
      phone: '',
      name: '',
      type: 'USER',
    });
  };

  const sendInvite = async () => {
    if (!inviteForm) return;
    const contact = inviteForm.email || inviteForm.phone;
    if (!contact) {
      alert('请输入邮箱或手机号');
      return;
    }

    try {
      const res = await fetch(`/api/admin/sales-partners/${inviteForm.partnerId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email || undefined,
          phone: inviteForm.phone || undefined,
          type: inviteForm.type,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // 生成销售合伙人注册链接
        const registerLink = `${window.location.origin}/register/sales-partner?invitation=${data.data.invitationId}&referral=${data.data.referralCode}`;

        // 显示链接供管理员复制
        setGeneratedLink(registerLink);
        setLinkCopied(false);
      } else {
        alert('❌ 生成失败: ' + data.error);
      }
    } catch (error) {
      alert('❌ 生成失败: ' + error);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-text-muted">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">邀请链接</h1>
          <p className="text-text-secondary mt-1">
            为销售合伙人生成邀请链接，邀请用户、服务商或销售合伙人加入平台
          </p>
        </div>
      </div>


      {/* Filter */}
      <div className="flex gap-4 bg-card border border-card-border rounded-lg p-4">
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className={inputCls + ' flex-1'}
        >
          <option value="">全部等级</option>
          <option value="BRONZE">青铜级</option>
          <option value="SILVER">白银级</option>
          <option value="GOLD">黄金级</option>
        </select>
      </div>

      {/* Partners List */}
      <div className="grid grid-cols-1 gap-4">
        {partners.length === 0 ? (
          <div className="text-center py-12 text-text-muted">暂无销售合伙人</div>
        ) : (
          partners.map((partner) => (
            <div key={partner.id} className="bg-card border border-card-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-text-primary">{partner.name}</h3>
                    <span className={`px-3 py-1 rounded text-xs font-medium ${tierColors[partner.tier]}`}>
                      {tierLabels[partner.tier]}
                    </span>
                    <span className={`px-3 py-1 rounded text-xs font-medium ${statusColors[partner.status]}`}>
                      {statusLabels[partner.status]}
                    </span>
                  </div>
                  {partner.companyName && (
                    <p className="text-sm text-text-secondary">{partner.companyName}</p>
                  )}
                  <p className="text-xs text-text-muted mt-1">{partner.email}</p>
                  <p className="text-xs text-text-muted">邀请码: {partner.referralCode}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded">
                  <p className="text-xs text-text-muted mb-1 flex items-center gap-1">
                    <Users size={14} /> 总邀请用户
                  </p>
                  <p className="text-2xl font-bold text-[#0d9488]">{partner.totalUsersInvited}</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded">
                  <p className="text-xs text-text-muted mb-1 flex items-center gap-1">
                    <Building size={14} /> 总邀请服务商
                  </p>
                  <p className="text-2xl font-bold text-[#0d9488]">{partner.totalProvidersInvited}</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded">
                  <p className="text-xs text-text-muted mb-1 flex items-center gap-1">
                    <TrendingUp size={14} /> 本周邀请用户
                  </p>
                  <p className="text-2xl font-bold text-amber-600">{partner.weekUsersInvited}</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded">
                  <p className="text-xs text-text-muted mb-1">本月邀请用户</p>
                  <p className="text-2xl font-bold text-amber-600">{partner.monthUsersInvited}</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded">
                  <p className="text-xs text-text-muted mb-1">创建时间</p>
                  <p className="text-xs font-medium text-text-primary">
                    {new Date(partner.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openInviteForm(partner.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#0d9488]/10 text-[#0d9488] text-sm rounded-lg hover:bg-[#0d9488]/20 transition-colors font-medium"
                >
                  <Send size={14} /> 发送邀请
                </button>
              </div>

              {/* Generated Link Display - Simplified */}
              {generatedLink && inviteForm?.partnerId === partner.id && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 rounded-lg mb-4">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="flex-1 px-2 py-1 bg-white dark:bg-[#1e1e1e] border border-blue-200 rounded text-xs font-mono text-text-secondary"
                    />
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(generatedLink);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      {linkCopied ? (
                        <>
                          <Check size={14} /> 已复制
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> 复制
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Invite Form - Simplified */}
              {inviteForm?.partnerId === partner.id && !generatedLink && (
                <div className="mt-4 border-t border-border-primary pt-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-text-muted mb-1">邮箱或手机</label>
                        <input
                          type="text"
                          className={inputCls}
                          placeholder="邮箱地址或手机号"
                          value={inviteForm.email || inviteForm.phone}
                          onChange={(e) => {
                            const val = e.target.value;
                            // 简单判断是否为邮箱
                            if (val.includes('@')) {
                              setInviteForm({ ...inviteForm, email: val, phone: '' });
                            } else {
                              setInviteForm({ ...inviteForm, phone: val, email: '' });
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">邀请类型</label>
                        <select
                          className={inputCls}
                          value={inviteForm.type}
                          onChange={(e) =>
                            setInviteForm({ ...inviteForm, type: e.target.value })
                          }
                        >
                          <option value="USER">用户</option>
                          <option value="SERVICE_PROVIDER">服务商</option>
                          <option value="SALES_PARTNER">销售合伙人</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={sendInvite}
                        className="flex-1 px-3 py-2 bg-[#0d9488] text-white text-sm rounded-lg hover:bg-[#0a7c71] transition-colors font-medium"
                      >
                        生成邀请链接
                      </button>
                      <button
                        onClick={() => {
                          setInviteForm(null);
                          setGeneratedLink(null);
                        }}
                        className="flex-1 px-3 py-2 bg-white dark:bg-[#1e1e1e] text-text-secondary border border-border-primary text-sm rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Link Generated - Show Copy Interface */}
              {generatedLink && inviteForm?.partnerId === partner.id && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setInviteForm(null);
                      setGeneratedLink(null);
                    }}
                    className="flex-1 px-3 py-2 bg-white dark:bg-[#1e1e1e] text-text-secondary border border-border-primary text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    完成
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
