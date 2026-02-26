import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const SMS_TEMPLATES = [
  {
    type: 'VERIFY_CODE',
    name: '注册验证码',
    content: '[优服佳] 您的验证码是: {{code}}，有效期为 10 分钟。如非本人操作，请忽略此消息。',
    description: '用户注册和登录时发送的验证码',
    variables: '{"code": "验证码"}',
  },
  {
    type: 'PROVIDER_INVITE',
    name: '邀请服务商入驻',
    content: '[优服佳] 我们邀请您在优服佳平台上提供专业服务，赚取更多收入。立即注册: {{registerLink}}',
    description: '邀请专业人士加入服务商平台',
    variables: '{"registerLink": "注册链接"}',
  },
  {
    type: 'NEW_ASSIGNED_ORDER',
    name: '新订单派遣通知',
    content: '[优服佳] 您有新的订单分配！订单号: {{orderNumber}}，金额: {{amount}}。请尽快确认: {{orderLink}}',
    description: '新订单派遣给服务商',
    variables: '{"orderNumber": "订单号", "amount": "订单金额", "orderLink": "订单链接"}',
  },
  {
    type: 'START_REFUSED',
    name: '开工申请被拒绝',
    content: '[优服佳] 您的开工申请（订单号: {{orderNumber}}）已被拒绝。原因: {{reason}}。请联系客户或平台客服。',
    description: '开工申请被拒绝时通知',
    variables: '{"orderNumber": "订单号", "reason": "拒绝原因"}',
  },
  {
    type: 'SERVICE_COMPLETED',
    name: '服务完成验收通知',
    content: '[优服佳] 您的订单（{{orderNumber}}）已完成。请尽快进行评价和尾款支付: {{orderLink}}',
    description: '服务完成后发送给客户',
    variables: '{"orderNumber": "订单号", "orderLink": "订单链接"}',
  },
  {
    type: 'REWORK_REQUIRED',
    name: '返工通知',
    content: '[优服佳] 您的订单（{{orderNumber}}）需要返工。请在 {{deadline}} 前处理: {{orderLink}}',
    description: '需要返工时发送的通知',
    variables: '{"orderNumber": "订单号", "deadline": "截止时间", "orderLink": "订单链接"}',
  },
  {
    type: 'PROVIDER_RESPONSE_ACCEPTED',
    name: '服务商接受单位通知',
    content: '[优服佳] 服务商已接受您的订单（{{orderNumber}}）。预计时间: {{scheduledTime}}。',
    description: '服务商接受订单时通知客户',
    variables: '{"orderNumber": "订单号", "scheduledTime": "预计时间"}',
  },
  {
    type: 'PROVIDER_RESPONSE_DECLINED',
    name: '服务商拒绝单位通知',
    content: '[优服佳] 服务商已拒绝您的订单（{{orderNumber}}）。我们会为您寻找其他服务商。',
    description: '服务商拒绝订单时通知客户',
    variables: '{"orderNumber": "订单号"}',
  },
  {
    type: 'ORDER_CANCELLED',
    name: '订单取消通知',
    content: '[优服佳] 您的订单（{{orderNumber}}）已取消。如有疑问，请联系客服。',
    description: '订单被取消时发送的通知',
    variables: '{"orderNumber": "订单号"}',
  },
  {
    type: 'PAYMENT_REMINDER',
    name: '付款提醒',
    content: '[优服佳] 订单（{{orderNumber}}）还有 {{remainingAmount}} 待支付。请尽快完成付款: {{paymentLink}}',
    description: '提醒客户进行付款',
    variables: '{"orderNumber": "订单号", "remainingAmount": "待付金额", "paymentLink": "支付链接"}',
  },
  {
    type: 'SERVICE_START_REQUEST',
    name: '开工申请通知',
    content: '[优服佳] 服务商申请开始工作（订单号: {{orderNumber}}）。请在 2 小时内确认: {{confirmLink}}',
    description: '服务商申请开工时通知客户',
    variables: '{"orderNumber": "订单号", "confirmLink": "确认链接"}',
  },
  {
    type: 'NEW_MESSAGE_NOTICE',
    name: '新消息通知',
    content: '[优服佳] {{senderName}} 给您发送了新消息。请查看: {{messageLink}}',
    description: '有新消息时发送的通知',
    variables: '{"senderName": "发送者名称", "messageLink": "消息链接"}',
  },
  {
    type: 'DEPOSIT_RECEIVED',
    name: '定金到账通知',
    content: '[优服佳] 您的定金（订单号: {{orderNumber}}, 金额: {{depositAmount}}）已收到。',
    description: '定金到账时发送的通知',
    variables: '{"orderNumber": "订单号", "depositAmount": "定金金额"}',
  },
  {
    type: 'SERVICE_START_REMINDER',
    name: '服务开始提醒',
    content: '[优服佳] 提醒：您预约的服务将在 {{hoursUntil}} 小时后开始。服务商: {{providerName}}',
    description: '服务开始前发送的提醒',
    variables: '{"hoursUntil": "距离时间（小时）", "providerName": "服务商名称"}',
  },
  {
    type: 'REVIEW_REMINDER',
    name: '评价提醒',
    content: '[优服佳] 订单（{{orderNumber}}）已完成，请对服务商进行评价: {{reviewLink}}',
    description: '服务完成后提醒进行评价',
    variables: '{"orderNumber": "订单号", "reviewLink": "评价链接"}',
  },
];

async function initSMSTemplates() {
  try {
    // Delete existing templates
    await prisma.sMSTemplate.deleteMany();
    console.log('✅ Cleared existing SMS templates');

    // Create new templates
    for (const template of SMS_TEMPLATES) {
      await prisma.sMSTemplate.create({
        data: {
          type: template.type as any,
          name: template.name,
          content: template.content,
          description: template.description,
          variables: template.variables,
          isActive: true,
        },
      });
    }

    console.log(`✅ Created ${SMS_TEMPLATES.length} SMS templates`);
    console.log('\n📱 SMS Templates:');
    SMS_TEMPLATES.forEach((t, idx) => {
      console.log(`  ${idx + 1}. ${t.name}`);
    });
  } catch (error) {
    console.error('❌ Error initializing SMS templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initSMSTemplates();
