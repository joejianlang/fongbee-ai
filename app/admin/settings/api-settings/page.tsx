'use client';

import { useState } from 'react';
import { Copy, Eye, EyeOff, AlertCircle, Save } from 'lucide-react';

interface APIConfig {
  id: string;
  service: string;
  name: string;
  value: string;
  masked: string;
  description: string;
  required: boolean;
  status: 'CONFIGURED' | 'NOT_CONFIGURED' | 'INVALID';
}

const API_CONFIGS: APIConfig[] = [
  // OpenAI & AI Models
  {
    id: 'openai-key',
    service: 'OpenAI',
    name: 'OpenAI API Key',
    value: 'sk_live_••••••••••••••••••••••••••••••••',
    masked: 'sk_live_••••••••••••••••••••••••••••••••',
    description: 'GPT-4 和 GPT-3.5 Turbo 模型的 API 密钥',
    required: false,
    status: 'CONFIGURED',
  },
  {
    id: 'anthropic-key',
    service: 'Anthropic Claude',
    name: 'Claude API Key',
    value: 'sk_••••••••••••••••••••••••••••••••',
    masked: 'sk_••••••••••••••••••••••••••••••••',
    description: 'Claude 3 系列模型的 API 密钥',
    required: false,
    status: 'CONFIGURED',
  },

  // Deepseek - 国产便宜模型
  {
    id: 'deepseek-key',
    service: 'Deepseek',
    name: 'Deepseek API Key',
    value: 'sk_••••••••••••••••••••••••••••••••',
    masked: 'sk_••••••••••••••••••••••••••••••••',
    description: '开源高性能模型，成本极低（$0.000278/1M tokens）',
    required: false,
    status: 'NOT_CONFIGURED',
  },

  // 阿里通义千问
  {
    id: 'qwen-key',
    service: '阿里云 Qwen',
    name: 'Qwen API Key',
    value: '••••••••••••••••••••••••••••••••',
    masked: '••••••••••••••••••••••••••••••••',
    description: '通义千问大模型，中文优化，价格便宜',
    required: false,
    status: 'NOT_CONFIGURED',
  },

  // 智谱 ChatGLM
  {
    id: 'chatglm-key',
    service: '智谱 ChatGLM',
    name: 'ChatGLM API Key',
    value: '••••••••••••••••••••••••••••••••',
    masked: '••••••••••••••••••••••••••••••••',
    description: '国产大模型，中文能力强，价格便宜',
    required: false,
    status: 'NOT_CONFIGURED',
  },

  // 百度文心一言
  {
    id: 'ernie-key',
    service: '百度文心',
    name: 'ERNIE API Key',
    value: '••••••••••••••••••••••••••••••••',
    masked: '••••••••••••••••••••••••••••••••',
    description: '百度AI文心一言，中文优化，接近免费',
    required: false,
    status: 'NOT_CONFIGURED',
  },

  // MiniMax
  {
    id: 'minimax-key',
    service: 'MiniMax',
    name: 'MiniMax API Key',
    value: '••••••••••••••••••••••••••••••••',
    masked: '••••••••••••••••••••••••••••••••',
    description: '国产轻量级模型，速度快成本低',
    required: false,
    status: 'NOT_CONFIGURED',
  },

  // YouTube
  {
    id: 'youtube-key',
    service: 'YouTube',
    name: 'YouTube Data API Key',
    value: 'AIza••••••••••••••••••••••••••••••••',
    masked: 'AIza••••••••••••••••••••••••••••••••',
    description: '用于获取 YouTube 视频和频道数据',
    required: true,
    status: 'CONFIGURED',
  },

  // SMS - Twilio
  {
    id: 'twilio-sid',
    service: 'Twilio SMS',
    name: 'Twilio Account SID',
    value: 'AC••••••••••••••••••••••••••••••••',
    masked: 'AC••••••••••••••••••••••••••••••••',
    description: 'Twilio 账户 SID',
    required: true,
    status: 'CONFIGURED',
  },
  {
    id: 'twilio-token',
    service: 'Twilio SMS',
    name: 'Twilio Auth Token',
    value: '••••••••••••••••••••••••••••••••',
    masked: '••••••••••••••••••••••••••••••••',
    description: 'Twilio 身份验证令牌',
    required: true,
    status: 'CONFIGURED',
  },
  {
    id: 'twilio-phone',
    service: 'Twilio SMS',
    name: 'Twilio Phone Number',
    value: '+1••••••••••',
    masked: '+1••••••••••',
    description: '用于发送短信的电话号码',
    required: true,
    status: 'CONFIGURED',
  },

  // Email - SendGrid
  {
    id: 'sendgrid-key',
    service: 'SendGrid Email',
    name: 'SendGrid API Key',
    value: 'SG.••••••••••••••••••••••••••••••••',
    masked: 'SG.••••••••••••••••••••••••••••••••',
    description: 'SendGrid 邮件服务 API 密钥',
    required: true,
    status: 'CONFIGURED',
  },

  // Database - Supabase
  {
    id: 'supabase-url',
    service: 'Supabase',
    name: 'Supabase Project URL',
    value: 'https://••••••.supabase.co',
    masked: 'https://••••••.supabase.co',
    description: 'Supabase 数据库项目 URL',
    required: true,
    status: 'CONFIGURED',
  },
  {
    id: 'supabase-key',
    service: 'Supabase',
    name: 'Supabase Anon Key',
    value: 'eyJhbGciOiJIUzI1NiIsInR5••••••••••',
    masked: 'eyJhbGciOiJIUzI1NiIsInR5••••••••••',
    description: 'Supabase 匿名公钥',
    required: true,
    status: 'CONFIGURED',
  },
  {
    id: 'supabase-service-key',
    service: 'Supabase',
    name: 'Supabase Service Role Key',
    value: 'eyJhbGciOiJIUzI1NiIsInR5••••••••••',
    masked: 'eyJhbGciOiJIUzI1NiIsInR5••••••••••',
    description: 'Supabase 服务角色密钥（仅服务器端使用）',
    required: true,
    status: 'CONFIGURED',
  },

  // Storage - AWS S3
  {
    id: 'aws-access-key',
    service: 'AWS S3',
    name: 'AWS Access Key ID',
    value: 'AKIA••••••••••••••••••',
    masked: 'AKIA••••••••••••••••••',
    description: 'AWS 访问密钥 ID',
    required: false,
    status: 'NOT_CONFIGURED',
  },
  {
    id: 'aws-secret-key',
    service: 'AWS S3',
    name: 'AWS Secret Access Key',
    value: '••••••••••••••••••••••••••••••••',
    masked: '••••••••••••••••••••••••••••••••',
    description: 'AWS 密钥',
    required: false,
    status: 'NOT_CONFIGURED',
  },
  {
    id: 'aws-region',
    service: 'AWS S3',
    name: 'AWS Region',
    value: 'us-east-1',
    masked: 'us-east-1',
    description: 'AWS S3 桶区域',
    required: false,
    status: 'NOT_CONFIGURED',
  },

  // Payment - Stripe
  {
    id: 'stripe-public-key',
    service: 'Stripe Payment',
    name: 'Stripe Publishable Key',
    value: 'pk_live_••••••••••••••••••••••••••••••••',
    masked: 'pk_live_••••••••••••••••••••••••••••••••',
    description: '客户端使用的公钥',
    required: false,
    status: 'NOT_CONFIGURED',
  },
  {
    id: 'stripe-secret-key',
    service: 'Stripe Payment',
    name: 'Stripe Secret Key',
    value: 'sk_live_••••••••••••••••••••••••••••••••',
    masked: 'sk_live_••••••••••••••••••••••••••••••••',
    description: '服务器端使用的密钥',
    required: false,
    status: 'NOT_CONFIGURED',
  },
];

const groupedConfigs = API_CONFIGS.reduce((acc, config) => {
  if (!acc[config.service]) {
    acc[config.service] = [];
  }
  acc[config.service].push(config);
  return acc;
}, {} as Record<string, APIConfig[]>);

export default function APISettingsPage() {
  const [showKey, setShowKey] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const configuredCount = API_CONFIGS.filter((c) => c.status === 'CONFIGURED').length;
  const notConfiguredCount = API_CONFIGS.filter((c) => c.status === 'NOT_CONFIGURED').length;
  const requiredCount = API_CONFIGS.filter((c) => c.required).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">API 设置</h1>
          <p className="text-text-secondary mt-1">集中管理所有服务 API 密钥</p>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl px-5 py-4">
          <p className="text-2xl font-bold text-green-600">{configuredCount}</p>
          <p className="text-sm text-text-secondary">已配置</p>
        </div>
        <div className="bg-yellow-50 rounded-xl px-5 py-4">
          <p className="text-2xl font-bold text-yellow-600">{notConfiguredCount}</p>
          <p className="text-sm text-text-secondary">未配置</p>
        </div>
        <div className="bg-blue-50 rounded-xl px-5 py-4">
          <p className="text-2xl font-bold text-blue-600">{requiredCount}</p>
          <p className="text-sm text-text-secondary">必需项</p>
        </div>
      </div>

      {/* Warning for missing required configs */}
      {notConfiguredCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex gap-3">
          <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">有未配置的 API 密钥</p>
            <p className="text-xs text-yellow-700 mt-1">请确保所有必需的 API 密钥已正确配置</p>
          </div>
        </div>
      )}

      {/* API Configs by Service */}
      <div className="space-y-6">
        {Object.entries(groupedConfigs).map(([service, configs]) => (
          <div key={service} className="bg-card border border-card-border rounded-lg overflow-hidden">
            <div className="bg-card-border/50 px-6 py-3 border-b border-card-border">
              <h2 className="text-base font-bold text-text-primary">{service}</h2>
            </div>

            <div className="p-6 space-y-4">
              {configs.map((config) => (
                <div key={config.id} className="border border-card-border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-text-primary">{config.name}</h3>
                        {config.required && (
                          <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 font-medium">
                            必需
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary">{config.description}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-xs font-medium flex-shrink-0 ${
                        config.status === 'CONFIGURED'
                          ? 'bg-green-100 text-green-700'
                          : config.status === 'INVALID'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {config.status === 'CONFIGURED' && '已配置'}
                      {config.status === 'NOT_CONFIGURED' && '未配置'}
                      {config.status === 'INVALID' && '无效'}
                    </span>
                  </div>

                  <div className="p-3 bg-background rounded-lg font-mono text-sm text-text-primary flex items-center justify-between">
                    <span className="truncate">
                      {showKey === config.id ? config.value : config.masked}
                    </span>
                    <div className="flex gap-2 flex-shrink-0 ml-2">
                      <button
                        onClick={() => setShowKey(showKey === config.id ? null : config.id)}
                        className="p-1 rounded hover:bg-card-border transition-colors"
                        title={showKey === config.id ? '隐藏' : '显示'}
                      >
                        {showKey === config.id ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        className="p-1 rounded hover:bg-card-border transition-colors"
                        title="复制"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Best Practices */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-bold text-blue-900">✅ 最佳实践</h3>
        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
          <li>确保所有密钥都存储在环境变量中，从不在代码中硬编码</li>
          <li>定期轮换 API 密钥以提高安全性</li>
          <li>使用最小权限原则，仅授予必要的权限</li>
          <li>监控 API 使用情况，检测异常活动</li>
          <li>为生产环境使用单独的 API 密钥</li>
        </ul>
      </div>
    </div>
  );
}
