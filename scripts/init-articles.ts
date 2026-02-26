import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DEFAULT_ARTICLES = [
  {
    type: 'USER_AGREEMENT',
    slug: 'user-agreement',
    title: '用户注册协议',
    subtitle: '优服佳平台用户服务条款',
    description: '使用优服佳平台前，请仔细阅读本协议',
    content: `<h2>用户注册协议</h2>
<p>欢迎使用优服佳平台。本协议约定了您使用本平台服务的权利和义务。</p>
<h3>1. 服务条款</h3>
<p>优服佳平台为用户提供本地服务连接平台。用户在使用本平台服务时，应遵守相关法律法规。</p>
<h3>2. 用户责任</h3>
<p>用户应对其账户信息的保密负责，不得将账户转让他人使用。</p>
<h3>3. 服务免责</h3>
<p>优服佳平台对用户使用本服务期间遭受的损失不承担责任。</p>`,
    status: 'PUBLISHED',
  },
  {
    type: 'PROVIDER_AGREEMENT',
    slug: 'provider-agreement',
    title: '服务商注册协议',
    subtitle: '加入优服佳平台的服务商服务条款',
    description: '成为优服佳服务商前必读',
    content: `<h2>服务商注册协议</h2>
<p>感谢您有兴趣成为优服佳平台的服务商。</p>
<h3>1. 资质要求</h3>
<p>服务商应具有相应的营业执照和服务能力证明。</p>
<h3>2. 服务承诺</h3>
<p>服务商承诺提供高质量的服务，按时完成订单，并维护良好的用户评价。</p>
<h3>3. 费用</h3>
<p>平台将按照一定比例收取服务费用。</p>`,
    status: 'PUBLISHED',
  },
  {
    type: 'PARTNER_AGREEMENT',
    slug: 'partner-agreement',
    title: '销售合伙人协议',
    subtitle: '优服佳销售合伙人合作条款',
    description: '了解如何成为优服佳销售合伙人',
    content: `<h2>销售合伙人协议</h2>
<p>本协议规定了销售合伙人与优服佳之间的合作关系。</p>
<h3>1. 合伙条件</h3>
<p>合伙人应具有一定的市场推广能力和人脉资源。</p>
<h3>2. 收益分配</h3>
<p>合伙人可获得推广佣金，具体比例根据合作协议确定。</p>
<h3>3. 权利与义务</h3>
<p>合伙人应诚实推广平台，不得虚假宣传。</p>`,
    status: 'PUBLISHED',
  },
  {
    type: 'CONFIDENTIALITY_AGREEMENT',
    slug: 'confidentiality-agreement',
    title: '保密协议',
    subtitle: '优服佳平台信息保护政策',
    description: '了解我们如何保护您的隐私信息',
    content: `<h2>保密协议</h2>
<p>优服佳平台高度重视用户隐私和信息安全。</p>
<h3>1. 信息收集</h3>
<p>我们仅收集提供服务所必需的信息。</p>
<h3>2. 信息使用</h3>
<p>用户信息仅用于服务提供和改进，不会泄露给第三方。</p>
<h3>3. 安全保护</h3>
<p>我们采用先进的加密技术保护用户信息安全。</p>`,
    status: 'PUBLISHED',
  },
  {
    type: 'KNOWLEDGE_ARTICLE',
    slug: 'how-to-use-platform',
    title: '平台使用指南',
    subtitle: '新手入门指南',
    description: '快速了解如何使用优服佳平台',
    content: `<h2>平台使用指南</h2>
<h3>1. 如何注册账户</h3>
<p>点击注册按钮，填写邮箱和密码，验证邮箱后即可使用。</p>
<h3>2. 如何发布服务需求</h3>
<p>登录后进入"发布需求"页面，选择服务类别并填写详细信息。</p>
<h3>3. 如何选择服务商</h3>
<p>浏览服务商列表，查看评价和价格，选择最合适的服务商。</p>
<h3>4. 如何进行支付</h3>
<p>平台支持多种支付方式，选择合适方式完成支付。</p>`,
    status: 'PUBLISHED',
  },
];

async function initArticles() {
  try {
    // Check existing articles
    const existingCount = await prisma.contentArticle.count();
    console.log(`📄 Current articles count: ${existingCount}`);

    // Create articles
    for (const article of DEFAULT_ARTICLES) {
      // Check if article exists
      const existing = await prisma.contentArticle.findUnique({
        where: { slug: article.slug },
      });

      if (!existing) {
        // Generate plain text
        const plainText = article.content
          .replace(/<[^>]*>/g, '')
          .trim();

        const created = await prisma.contentArticle.create({
          data: {
            ...article,
            plainText,
            publishedAt: article.status === 'PUBLISHED' ? new Date() : null,
          },
        });

        // Create first version
        await prisma.contentArticleVersion.create({
          data: {
            articleId: created.id,
            version: 1,
            title: created.title,
            subtitle: created.subtitle,
            description: created.description,
            content: created.content,
            plainText,
            changesSummary: 'Initial version',
          },
        });

        console.log(`✅ Created: ${article.title}`);
      } else {
        console.log(`⏭️  Skipped (exists): ${article.title}`);
      }
    }

    const finalCount = await prisma.contentArticle.count();
    console.log(`\n📊 Total articles: ${finalCount}`);
    console.log('\n✅ Article initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing articles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initArticles();
