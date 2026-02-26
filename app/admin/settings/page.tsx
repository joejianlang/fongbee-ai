'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Settings,
  FileText,
  Tag,
  MessageSquare,
  BarChart3,
  Mail,
  Database,
  Zap,
  Globe,
  Shield,
  Users,
  Newspaper,
  Package,
  AlertCircle,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';

interface SettingModule {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
  status: 'active' | 'inactive';
}

const SETTING_MODULES: SettingModule[] = [
  {
    id: 'category',
    label: '分类管理',
    description: '管理平台服务分类',
    icon: Tag,
    href: '/admin/settings/categories',
    status: 'active',
  },
  {
    id: 'articles',
    label: '原创文章管理',
    description: '编辑和发布原创文章',
    icon: FileText,
    href: '/admin/settings/articles',
    status: 'active',
  },
  {
    id: 'ads-review',
    label: '广告审核',
    description: '审核和管理广告内容',
    icon: AlertCircle,
    href: '/admin/settings/ads-review',
    status: 'active',
  },
  {
    id: 'email-config',
    label: '邮件配置',
    description: '配置邮件服务和模板',
    icon: Mail,
    href: '/admin/settings/email-config',
    status: 'active',
  },
  {
    id: 'ads-settings',
    label: '广告设置',
    description: '管理广告展示规则',
    icon: Package,
    href: '/admin/settings/ads-settings',
    status: 'active',
  },
  {
    id: 'knowledge-config',
    label: '知识库配置',
    description: '配置知识库和FAQ',
    icon: Database,
    href: '/admin/settings/knowledge-config',
    status: 'active',
  },
  {
    id: 'content-management',
    label: '内容管理',
    description: '管理平台内容',
    icon: FileText,
    href: '/admin/settings/content-management',
    status: 'active',
  },
  {
    id: 'ai-news',
    label: 'AI 新闻管理',
    description: '发布和管理 AI 相关新闻',
    icon: Newspaper,
    href: '/admin/settings/ai-news',
    status: 'active',
  },
  {
    id: 'ads-analytics',
    label: '广告分析',
    description: '查看广告投放数据和效果',
    icon: BarChart3,
    href: '/admin/settings/ads-analytics',
    status: 'active',
  },
  {
    id: 'report-analytics',
    label: '报表分析',
    description: '平台运营数据报表',
    icon: BarChart3,
    href: '/admin/settings/report-analytics',
    status: 'active',
  },
  {
    id: 'community-content',
    label: '社区内容管理',
    description: '管理用户生成的社区内容',
    icon: Users,
    href: '/admin/settings/community-content',
    status: 'active',
  },
  {
    id: 'agreements',
    label: '协议文件管理',
    description: '管理服务条款和隐私政策',
    icon: Shield,
    href: '/admin/settings/agreements',
    status: 'active',
  },
  {
    id: 'sms-config',
    label: '短信配置',
    description: '配置短信服务',
    icon: MessageSquare,
    href: '/admin/settings/sms-config',
    status: 'active',
  },
  {
    id: 'api-settings',
    label: 'API 设置',
    description: '管理 API 密钥和权限',
    icon: Zap,
    href: '/admin/settings/api-settings',
    status: 'active',
  },
  {
    id: 'basic-settings',
    label: '基本设置',
    description: '平台基础配置',
    icon: Globe,
    href: '/admin/settings/basic',
    status: 'active',
  },
];

export default function AIGlobalSettingsPage() {
  const [search, setSearch] = useState('');

  const filtered = SETTING_MODULES.filter((m) => {
    const matchSearch =
      !search ||
      m.label.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const activeCount = SETTING_MODULES.filter((m) => m.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">AI 全局系统设置</h1>
        <p className="text-text-secondary mt-1">管理平台全局配置和功能模块</p>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl px-5 py-4">
          <p className="text-2xl font-bold text-blue-600">{SETTING_MODULES.length}</p>
          <p className="text-sm text-text-secondary">总模块数</p>
        </div>
        <div className="bg-green-50 rounded-xl px-5 py-4">
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          <p className="text-sm text-text-secondary">已激活</p>
        </div>
        <div className="bg-purple-50 rounded-xl px-5 py-4">
          <p className="text-2xl font-bold text-purple-600">{SETTING_MODULES.filter((m) => m.status === 'inactive').length}</p>
          <p className="text-sm text-text-secondary">未激活</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative flex-1 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索模块..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-card-border rounded-lg bg-card text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-[#0d9488]/40"
        />
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-text-muted">未找到匹配的模块</p>
          </div>
        ) : (
          filtered.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.id}
                href={module.href}
                className="bg-card border border-card-border rounded-lg p-5 hover:border-[#0d9488] hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-[#0d9488]/10 group-hover:bg-[#0d9488]/20 transition-colors">
                    <Icon size={20} className="text-[#0d9488]" />
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      module.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {module.status === 'active' ? '已激活' : '未激活'}
                  </span>
                </div>
                <h3 className="font-semibold text-text-primary text-sm mb-1 group-hover:text-[#0d9488] transition-colors">
                  {module.label}
                </h3>
                <p className="text-xs text-text-muted mb-4">{module.description}</p>
                <div className="flex items-center text-[#0d9488] text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  进入配置
                  <ChevronRight size={14} className="ml-1" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
