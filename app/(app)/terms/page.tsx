'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. 接受条款',
    body: '通过注册或使用数位 Buffet 平台，您确认已阅读、理解并同意受本用户注册协议约束。如您不同意本协议任何条款，请勿使用本平台。',
  },
  {
    title: '2. 账号注册与安全',
    body: '您在注册时须提供真实、准确、完整的信息，并负责维护账号的安全性。请勿与他人共享您的账号密码。因账号信息泄露导致的损失由用户自行承担。如发现账号异常，请立即联系我们。',
  },
  {
    title: '3. 使用规范',
    body: '您同意不以任何违法或有害方式使用本平台，包括但不限于：发布虚假、欺诈性信息；侵犯他人知识产权；散布垃圾信息或恶意软件；试图未授权访问系统；从事洗钱或非法交易等活动。',
  },
  {
    title: '4. 内容责任',
    body: '用户在平台上发布的内容（论坛帖子、评价等）须遵守相关法律法规。您对自己发布的内容负责。数位 Buffet 保留删除违规内容和封禁违规账号的权利，无需提前通知。',
  },
  {
    title: '5. 服务提供商',
    body: '平台上的服务提供商为独立第三方，其提供的服务由服务提供商自行负责。数位 Buffet 不对第三方服务的质量、安全性或合法性作出保证，但我们会尽力筛选和监督平台上的服务提供商。',
  },
  {
    title: '6. 付款与退款',
    body: '通过平台进行的付款受我们的付款政策约束。退款政策因服务类型不同而有所差异，具体以订单页面说明为准。如发生争议，请通过平台内置渠道提交申诉。',
  },
  {
    title: '7. 知识产权',
    body: '数位 Buffet 平台的所有内容（包括软件、设计、商标、文字等）受知识产权法保护，归数位 Buffet 所有。未经授权，不得复制、修改、分发或商业使用。',
  },
  {
    title: '8. 免责声明',
    body: '本平台按"现状"提供服务，不作任何明示或默示的保证。在法律允许的最大范围内，数位 Buffet 不对任何间接、偶然或结果性损害承担责任。我们的总赔偿责任不超过您在过去三个月内向平台支付的金额。',
  },
  {
    title: '9. 账号终止',
    body: '您可随时注销账号。数位 Buffet 保留因违反本协议而暂停或终止您账号的权利。账号终止后，您在平台上的数据将依据我们的隐私政策进行处理。',
  },
  {
    title: '10. 适用法律',
    body: '本协议受加拿大联邦法律及您所在省份的法律管辖。与本协议相关的任何争议应提交至不列颠哥伦比亚省（BC省）法院解决。',
  },
  {
    title: '11. 协议变更',
    body: '我们可能更新本协议。重大变更将提前 30 天通过邮件或平台通知告知用户。继续使用平台即视为接受更新后的协议。如不接受，请在生效前注销账号。',
  },
  {
    title: '12. 联系我们',
    body: '如对本协议有任何问题，请联系：legal@fongbee.ca',
  },
];

export default function TermsPage() {
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
        <span className="font-semibold text-text-primary dark:text-white text-sm">用户注册协议</span>
      </div>

      <div className="px-4 md:max-w-2xl md:mx-auto mt-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#0d9488] to-[#0a7c71] rounded-2xl p-6 mb-6 text-white">
          <h1 className="text-2xl font-bold mb-1">用户注册协议</h1>
          <p className="text-white/80 text-sm">Terms of Service</p>
          <p className="text-white/70 text-xs mt-3">生效日期：2025年1月1日 · 最后更新：2026年2月</p>
        </div>

        {/* Intro */}
        <p className="text-text-secondary dark:text-gray-300 text-sm leading-relaxed mb-6 px-1">
          欢迎使用数位 Buffet 平台。本用户注册协议（以下简称"协议"）规定了您使用本平台的条件和规则，请在注册前仔细阅读。
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

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-text-muted leading-relaxed px-4">
            注册账号即表示您同意本协议全部条款。
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-[#0d9488]">
            <Link href="/privacy" className="hover:underline">隐私政策</Link>
            <span className="text-text-muted">·</span>
            <a href="mailto:legal@fongbee.ca" className="hover:underline">联系我们</a>
          </div>
        </div>
      </div>
    </div>
  );
}
