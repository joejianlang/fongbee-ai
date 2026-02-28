'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. 信息收集',
    body: '我们收集您在注册、使用本平台时主动提供的信息（如姓名、邮箱、手机号），以及在使用过程中自动产生的日志数据（如 IP 地址、设备类型、访问时间）。我们仅收集实现服务所必要的最少量信息。',
  },
  {
    title: '2. 信息使用',
    body: '我们使用所收集的信息用于：提供、维护和改善平台服务；向您发送验证码、通知和服务相关信息；进行安全监控和欺诈防范；遵守适用法律法规的要求。我们不会将您的个人信息出售给第三方。',
  },
  {
    title: '3. 信息存储与保护',
    body: '您的数据存储于加拿大或美国的服务器上，受行业标准的加密和安全措施保护。我们采用 TLS 加密传输、bcrypt 密码哈希及访问控制机制来保护您的数据安全。',
  },
  {
    title: '4. 信息共享',
    body: '除以下情形外，我们不会与第三方共享您的个人信息：（1）经您明确同意；（2）为完成服务所必须的服务提供商（如支付处理、邮件发送）；（3）法律要求或政府机构依法要求。',
  },
  {
    title: '5. Cookie 与追踪技术',
    body: '我们使用必要的 Cookie 来维持您的登录状态和语言偏好。我们不使用第三方广告追踪 Cookie。您可以通过浏览器设置管理 Cookie，但禁用必要 Cookie 可能影响部分功能。',
  },
  {
    title: '6. 您的权利（CPPA 合规）',
    body: '依据加拿大《消费者隐私保护法》（CPPA），您享有以下权利：访问您的个人信息；更正不准确的信息；在特定条件下要求删除您的信息；撤回同意；对自动决策提出质疑。如需行使上述权利，请联系我们。',
  },
  {
    title: '7. 未成年人隐私',
    body: '本平台不面向 13 岁以下未成年人。如果我们发现无意间收集了未成年人信息，将立即予以删除。如您认为我们收集了您孩子的信息，请及时联系我们。',
  },
  {
    title: '8. 隐私政策变更',
    body: '我们可能不时更新本隐私政策。重大变更时，我们将通过平台内通知或电子邮件告知您。继续使用本平台即表示您接受更新后的隐私政策。',
  },
  {
    title: '9. 联系我们',
    body: '如您对本隐私政策有任何疑问或请求，请发送邮件至：privacy@fongbee.ca',
  },
];

export default function PrivacyPage() {
  return (
    <div className="pb-10">
      {/* Sticky header */}
      <div className="sticky top-14 z-40 bg-white dark:bg-[#2d2d30] border-b border-border-primary px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors"
        >
          <ArrowLeft size={18} />
          返回
        </Link>
        <span className="font-semibold text-text-primary dark:text-white text-sm">隐私政策</span>
      </div>

      <div className="px-4 md:max-w-2xl md:mx-auto mt-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#0d9488] to-[#0a7c71] rounded-2xl p-6 mb-6 text-white">
          <h1 className="text-2xl font-bold mb-1">隐私政策</h1>
          <p className="text-white/80 text-sm">Privacy Policy</p>
          <p className="text-white/70 text-xs mt-3">生效日期：2025年1月1日 · 最后更新：2026年2月</p>
        </div>

        {/* Intro */}
        <p className="text-text-secondary dark:text-gray-300 text-sm leading-relaxed mb-6 px-1">
          数位 Buffet（以下简称"我们"）尊重并保护用户的个人隐私。本隐私政策说明我们如何收集、使用和保护您在使用本平台时提供的信息。
        </p>

        {/* Sections */}
        <div className="space-y-4">
          {SECTIONS.map((s) => (
            <div
              key={s.title}
              className="bg-white dark:bg-[#2d2d30] rounded-xl p-5 shadow-sm border border-border-primary"
            >
              <h2 className="font-semibold text-text-primary dark:text-white text-[15px] mb-2">
                {s.title}
              </h2>
              <p className="text-text-secondary dark:text-gray-300 text-sm leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-xs text-text-muted text-center mt-8 px-4 leading-relaxed">
          本政策适用于数位 Buffet 旗下所有产品及服务。<br />
          如有疑问请联系 privacy@fongbee.ca
        </p>
      </div>
    </div>
  );
}
