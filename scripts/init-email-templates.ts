import { prisma } from '@/lib/db';

const EMAIL_TEMPLATES = [
  {
    type: 'VERIFY_CODE',
    name: '验证码邮件',
    subject: '[优服佳] 您的验证码是: {{code}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>验证您的账户</h2>
        <p>亲爱的 {{name}},</p>
        <p>您的验证码是:</p>
        <h1 style="color: #0d9488; letter-spacing: 5px;">{{code}}</h1>
        <p>此验证码有效期为 10 分钟。</p>
        <p>如果您没有请求此验证码，请忽略此邮件。</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">© 2026 优服佳 本地服务与AI新闻集成平台</p>
      </div>
    `,
    description: '用户注册和登录时发送的验证码邮件',
    variables: '{"name": "收件人名称", "code": "验证码"}',
  },
  {
    type: 'PROVIDER_HIRED',
    name: '服务商被聘用通知',
    subject: '[优服佳] 恭喜！您被聘用了',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>您有新的服务订单！</h2>
        <p>亲爱的 {{providerName}},</p>
        <p>恭喜！用户 <strong>{{customerName}}</strong> 选择了您的服务。</p>
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>订单详情:</strong></p>
          <p>订单号: {{orderNumber}}</p>
          <p>服务类型: {{serviceType}}</p>
          <p>订单金额: {{amount}}</p>
          <p>预计时间: {{scheduledTime}}</p>
        </div>
        <p><a href="{{dashboardLink}}" style="background: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">查看订单详情</a></p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">© 2026 优服佳 本地服务与AI新闻集成平台</p>
      </div>
    `,
    description: '服务商被选中时发送的通知邮件',
    variables: '{"providerName": "服务商名称", "customerName": "客户名称", "orderNumber": "订单号", "serviceType": "服务类型", "amount": "订单金额", "scheduledTime": "预计时间", "dashboardLink": "仪表板链接"}',
  },
  {
    type: 'SALES_INVITATION',
    name: '销售合伙人邀请',
    subject: '[优服佳] 邀请您成为销售合伙人',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>成为销售合伙人</h2>
        <p>亲爱的 {{name}},</p>
        <p>优服佳诚挚邀请您成为我们的销售合伙人，一起开拓本地服务市场。</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>合伙人权益:</strong></p>
          <ul>
            <li>提供有竞争力的佣金比例</li>
            <li>专业的技术支持和培训</li>
            <li>市场营销资源支持</li>
            <li>优先获取新服务类目</li>
          </ul>
        </div>
        <p><a href="{{invitationLink}}" style="background: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">接受邀请</a></p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">© 2026 优服佳 本地服务与AI新闻集成平台</p>
      </div>
    `,
    description: '邀请用户成为销售合伙人',
    variables: '{"name": "收件人名称", "invitationLink": "邀请链接"}',
  },
  {
    type: 'PROVIDER_INVITATION',
    name: '服务商入驻邀请',
    subject: '[优服佳] 邀请您加入我们的服务商平台',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>成为优服佳服务商</h2>
        <p>亲爱的 {{name}},</p>
        <p>我们邀请您在优服佳平台上提供您的专业服务，赚取更多收入。</p>
        <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>服务商权益:</strong></p>
          <ul>
            <li>灵活的工作时间安排</li>
            <li>透明的佣金体系</li>
            <li>7×24 技术支持</li>
            <li>客户评价和信誉建立</li>
          </ul>
        </div>
        <p><a href="{{registerLink}}" style="background: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">立即注册</a></p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">© 2026 优服佳 本地服务与AI新闻集成平台</p>
      </div>
    `,
    description: '邀请专业人士加入服务商平台',
    variables: '{"name": "收件人名称", "registerLink": "注册链接"}',
  },
  {
    type: 'USER_INVITATION',
    name: '用户邀请注册',
    subject: '[优服佳] {{inviterName}} 邀请您加入优服佳',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>朋友邀请您加入优服佳</h2>
        <p>亲爱的 {{name}},</p>
        <p><strong>{{inviterName}}</strong> 邀请您加入优服佳，发现并预订本地优质服务。</p>
        <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>优服佳的优势:</strong></p>
          <ul>
            <li>便捷预订本地服务</li>
            <li>专业认证的服务提供商</li>
            <li>透明的价格与评价</li>
            <li>安全的支付保障</li>
          </ul>
        </div>
        <p>使用邀请码: <strong>{{invitationCode}}</strong></p>
        <p><a href="{{signupLink}}" style="background: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">注册账户</a></p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">© 2026 优服佳 本地服务与AI新闻集成平台</p>
      </div>
    `,
    description: '用户邀请其他用户注册',
    variables: '{"name": "收件人名称", "inviterName": "邀请者名称", "invitationCode": "邀请码", "signupLink": "注册链接"}',
  },
  {
    type: 'ORDER_CONFIRMATION',
    name: '订单确认通知',
    subject: '[优服佳] 您的订单已确认 #{{orderNumber}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>订单已确认</h2>
        <p>亲爱的 {{customerName}},</p>
        <p>感谢您的订单！我们已确认您的服务预约。</p>
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>订单信息:</strong></p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">订单号:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>{{orderNumber}}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">服务类型:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">{{serviceType}}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">服务商:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">{{providerName}}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">预计时间:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">{{scheduledTime}}</td>
            </tr>
            <tr>
              <td style="padding: 8px;">订单总额:</td>
              <td style="padding: 8px;"><strong>{{totalAmount}}</strong></td>
            </tr>
          </table>
        </div>
        <p><a href="{{orderLink}}" style="background: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">查看订单</a></p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">© 2026 优服佳 本地服务与AI新闻集成平台</p>
      </div>
    `,
    description: '订单被确认时发送给客户',
    variables: '{"customerName": "客户名称", "orderNumber": "订单号", "serviceType": "服务类型", "providerName": "服务商名称", "scheduledTime": "预计时间", "totalAmount": "订单总额", "orderLink": "订单链接"}',
  },
  {
    type: 'SERVICE_REMINDER',
    name: '服务提醒',
    subject: '[优服佳] 提醒：您预约的服务即将开始',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>服务提醒</h2>
        <p>亲爱的 {{customerName}},</p>
        <p>这是一条温馨提醒，您预约的服务将在 <strong>{{hoursUntil}} 小时后</strong>开始。</p>
        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>服务详情:</strong></p>
          <p>服务商: {{providerName}}</p>
          <p>服务类型: {{serviceType}}</p>
          <p>开始时间: {{serviceTime}}</p>
          <p>地点: {{location}}</p>
        </div>
        <p style="color: #d97706; font-weight: bold;">✓ 请确保您已在家/指定地点等待服务商到来</p>
        <p><a href="{{contactLink}}" style="background: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">联系服务商</a></p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">© 2026 优服佳 本地服务与AI新闻集成平台</p>
      </div>
    `,
    description: '服务开始前1小时发送给客户的提醒邮件',
    variables: '{"customerName": "客户名称", "hoursUntil": "距离时间（小时）", "providerName": "服务商名称", "serviceType": "服务类型", "serviceTime": "服务时间", "location": "服务地点", "contactLink": "联系链接"}',
  },
];

async function initEmailTemplates() {
  try {
    // Delete existing templates
    await prisma.emailTemplate.deleteMany();
    console.log('✅ Cleared existing email templates');

    // Create new templates
    for (const template of EMAIL_TEMPLATES) {
      await prisma.emailTemplate.create({
        data: {
          type: template.type as any,
          name: template.name,
          subject: template.subject,
          htmlContent: template.htmlContent,
          description: template.description,
          variables: template.variables,
          isActive: true,
        },
      });
    }

    console.log(`✅ Created ${EMAIL_TEMPLATES.length} email templates`);
    console.log('\n📧 Email Templates:');
    EMAIL_TEMPLATES.forEach((t, idx) => {
      console.log(`  ${idx + 1}. ${t.name}`);
    });
  } catch (error) {
    console.error('❌ Error initializing templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initEmailTemplates();
