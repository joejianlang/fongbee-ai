import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// ─── 12 Service Categories ────────────────────────────────────────────────────
const CATEGORY_DEFS = [
  {
    name: '家庭清洁', nameEn: 'Home Cleaning', slug: 'cleaning',
    icon: 'home', color: '#10b981', displayOrder: 1,
    fields: [
      { fieldType: 'chips',      fieldKey: 'house_type',   label: '房屋类型',   required: true,  options: ['公寓', '独立屋', '半独立屋', '联排别墅'],         displayOrder: 1 },
      { fieldType: 'chips',      fieldKey: 'room_count',   label: '房间数量',   required: true,  options: ['1室', '2室', '3室', '4室', '5室+'],               displayOrder: 2 },
      { fieldType: 'chips',      fieldKey: 'clean_type',   label: '清洁类型',   required: true,  options: ['常规清洁', '深度清洁', '入住清洁', '搬出清洁'],     displayOrder: 3 },
      { fieldType: 'multichips', fieldKey: 'extra_items',  label: '额外项目',   required: false, options: ['冰箱内部', '烤箱内部', '橱柜内', '窗户', '地毯'],   displayOrder: 4 },
      { fieldType: 'textarea',   fieldKey: 'notes',        label: '特殊说明',   required: false, displayOrder: 5, placeholder: '如宠物、过敏源、特殊区域…' },
    ],
  },
  {
    name: '教育辅导', nameEn: 'Tutoring', slug: 'tutoring',
    icon: 'book-open', color: '#6366f1', displayOrder: 2,
    fields: [
      { fieldType: 'chips',      fieldKey: 'student_grade', label: '学生年级', required: true,  options: ['小学', '初中', '高中', '大学', '成人'],             displayOrder: 1 },
      { fieldType: 'multichips', fieldKey: 'subjects',      label: '辅导科目', required: true,  options: ['数学', '英语', '法语', '物理', '化学', '计算机'],   displayOrder: 2 },
      { fieldType: 'chips',      fieldKey: 'mode',          label: '上课方式', required: true,  options: ['线上', '上门', '到教师家'],                         displayOrder: 3 },
      { fieldType: 'number',     fieldKey: 'hours_per_week',label: '每周课时', required: false, placeholder: '如：2', displayOrder: 4 },
      { fieldType: 'textarea',   fieldKey: 'goal',          label: '学习目标', required: false, placeholder: '描述孩子的具体需求…', displayOrder: 5 },
    ],
  },
  {
    name: '搬家服务', nameEn: 'Moving', slug: 'moving',
    icon: 'truck', color: '#3b82f6', displayOrder: 3,
    fields: [
      { fieldType: 'chips',    fieldKey: 'move_type',    label: '搬家类型',   required: true,  options: ['公寓搬家', '独立屋搬家', '办公室搬迁', '单件运输'],  displayOrder: 1 },
      { fieldType: 'text',     fieldKey: 'from_address', label: '出发地址',   required: true,  placeholder: '现住址，如：123 Main St, Guelph',               displayOrder: 2 },
      { fieldType: 'text',     fieldKey: 'to_address',   label: '目的地址',   required: true,  placeholder: '新地址',                                         displayOrder: 3 },
      { fieldType: 'date',     fieldKey: 'move_date',    label: '搬家日期',   required: true,  displayOrder: 4 },
      { fieldType: 'chips',    fieldKey: 'floor',        label: '楼层情况',   required: false, options: ['有电梯', '无电梯1-3层', '无电梯4层+'],               displayOrder: 5 },
      { fieldType: 'textarea', fieldKey: 'large_items',  label: '大型家具说明', required: false, placeholder: '如钢琴、大型冰箱等',                            displayOrder: 6 },
    ],
  },
  {
    name: '园艺绿化', nameEn: 'Gardening', slug: 'gardening',
    icon: 'leaf', color: '#22c55e', displayOrder: 4,
    fields: [
      { fieldType: 'multichips', fieldKey: 'services',    label: '服务内容',   required: true,  options: ['修剪草坪', '树木修剪', '除草', '施肥', '种植', '落叶清理'], displayOrder: 1 },
      { fieldType: 'chips',      fieldKey: 'yard_size',   label: '院子大小',   required: true,  options: ['小型(<500sqft)', '中型(500-1500sqft)', '大型(>1500sqft)'], displayOrder: 2 },
      { fieldType: 'chips',      fieldKey: 'frequency',   label: '服务频率',   required: false, options: ['单次', '每周', '每两周', '每月'],                   displayOrder: 3 },
      { fieldType: 'textarea',   fieldKey: 'notes',       label: '特殊要求',   required: false, placeholder: '如特定植物种类、禁止使用农药等…', displayOrder: 4 },
    ],
  },
  {
    name: '财税咨询', nameEn: 'Tax & Finance', slug: 'tax',
    icon: 'calculator', color: '#f59e0b', displayOrder: 5,
    fields: [
      { fieldType: 'chips',      fieldKey: 'service_type',  label: '咨询类型',   required: true,  options: ['个人报税', '企业报税', '财务规划', 'GST/HST', '移民财税'], displayOrder: 1 },
      { fieldType: 'chips',      fieldKey: 'tax_year',      label: '税务年度',   required: true,  options: ['2024', '2023', '2022', '多年补报'],                 displayOrder: 2 },
      { fieldType: 'multichips', fieldKey: 'income_sources',label: '收入来源',   required: false, options: ['工资', '自雇收入', '投资', '房租', '海外收入'],      displayOrder: 3 },
      { fieldType: 'textarea',   fieldKey: 'special_case',  label: '特殊情况说明', required: false, placeholder: '如首次报税、房产出售、留学生身份…', displayOrder: 4 },
    ],
  },
  {
    name: '家电维修', nameEn: 'Appliance Repair', slug: 'repair',
    icon: 'wrench', color: '#ef4444', displayOrder: 6,
    fields: [
      { fieldType: 'chips',    fieldKey: 'appliance_type', label: '电器类型',   required: true,  options: ['洗衣机', '干衣机', '冰箱', '洗碗机', '空调', '炉灶', '其他'], displayOrder: 1 },
      { fieldType: 'chips',    fieldKey: 'brand',          label: '品牌',       required: false, options: ['Samsung', 'LG', 'Whirlpool', 'Bosch', 'GE', '其他'],         displayOrder: 2 },
      { fieldType: 'textarea', fieldKey: 'problem_desc',   label: '故障描述',   required: true,  placeholder: '请描述电器的故障现象，如噪音、不启动、漏水等…',           displayOrder: 3 },
      { fieldType: 'chips',    fieldKey: 'urgency',        label: '紧急程度',   required: false, options: ['不紧急', '3天内', '今天'],                                    displayOrder: 4 },
    ],
  },
  {
    name: '摄影摄像', nameEn: 'Photography', slug: 'photography',
    icon: 'camera', color: '#ec4899', displayOrder: 7,
    fields: [
      { fieldType: 'chips',    fieldKey: 'photo_type',  label: '拍摄类型',   required: true,  options: ['婚礼摄影', '家庭照', '证件照', '活动摄影', '商业摄影', '写真'], displayOrder: 1 },
      { fieldType: 'date',     fieldKey: 'shoot_date',  label: '拍摄日期',   required: true,  displayOrder: 2 },
      { fieldType: 'chips',    fieldKey: 'duration',    label: '拍摄时长',   required: false, options: ['1小时', '2小时', '4小时', '全天'],                               displayOrder: 3 },
      { fieldType: 'chips',    fieldKey: 'location',    label: '拍摄地点',   required: false, options: ['室外', '室内', '摄影棚', '指定场地'],                            displayOrder: 4 },
      { fieldType: 'textarea', fieldKey: 'style_notes', label: '风格要求',   required: false, placeholder: '如胶片风、日系清新、商务正式…', displayOrder: 5 },
    ],
  },
  {
    name: '翻译口译', nameEn: 'Translation', slug: 'translation',
    icon: 'globe', color: '#8b5cf6', displayOrder: 8,
    fields: [
      { fieldType: 'chips',    fieldKey: 'service_type',  label: '服务类型', required: true,  options: ['文件翻译', '现场口译', '电话口译', '视频口译', '公证翻译'],     displayOrder: 1 },
      { fieldType: 'chips',    fieldKey: 'from_lang',     label: '源语言',   required: true,  options: ['中文', '英文', '法文', '其他'],                                  displayOrder: 2 },
      { fieldType: 'chips',    fieldKey: 'to_lang',       label: '目标语言', required: true,  options: ['中文', '英文', '法文', '其他'],                                  displayOrder: 3 },
      { fieldType: 'number',   fieldKey: 'word_count',    label: '字数/页数', required: false, placeholder: '约多少字或页', displayOrder: 4 },
      { fieldType: 'textarea', fieldKey: 'doc_desc',      label: '文件说明', required: false, placeholder: '如合同、医疗报告、移民材料…', displayOrder: 5 },
    ],
  },
  {
    name: '美容美发', nameEn: 'Beauty', slug: 'beauty',
    icon: 'sparkles', color: '#f472b6', displayOrder: 9,
    fields: [
      { fieldType: 'multichips', fieldKey: 'services',   label: '服务项目', required: true,  options: ['剪发', '染发', '烫发', '护理', '美甲', '眉形', '化妆'], displayOrder: 1 },
      { fieldType: 'chips',      fieldKey: 'mode',       label: '上门/到店', required: true,  options: ['上门服务', '到店服务'],                                  displayOrder: 2 },
      { fieldType: 'textarea',   fieldKey: 'style_ref',  label: '风格参考', required: false, placeholder: '可描述喜欢的风格或参考图片链接…', displayOrder: 3 },
    ],
  },
  {
    name: '宠物服务', nameEn: 'Pet Care', slug: 'pet',
    icon: 'heart', color: '#f97316', displayOrder: 10,
    fields: [
      { fieldType: 'chips',      fieldKey: 'pet_type',    label: '宠物类型', required: true,  options: ['狗', '猫', '小动物', '其他'],                                   displayOrder: 1 },
      { fieldType: 'multichips', fieldKey: 'services',    label: '服务项目', required: true,  options: ['遛狗', '宠物寄养', '上门喂食', '宠物美容', '宠物接送'],         displayOrder: 2 },
      { fieldType: 'text',       fieldKey: 'pet_breed',   label: '品种/体重', required: false, placeholder: '如：金毛 30kg',                                             displayOrder: 3 },
      { fieldType: 'textarea',   fieldKey: 'special_needs',label: '特殊需求', required: false, placeholder: '过敏、药物、饮食禁忌等',                                    displayOrder: 4 },
    ],
  },
  {
    name: '餐饮外送', nameEn: 'Catering', slug: 'catering',
    icon: 'chef-hat', color: '#14b8a6', displayOrder: 11,
    fields: [
      { fieldType: 'chips',    fieldKey: 'event_type',  label: '活动类型', required: true,  options: ['家庭聚餐', '商务宴请', '生日派对', '婚礼', '其他'],                displayOrder: 1 },
      { fieldType: 'chips',    fieldKey: 'cuisine',     label: '菜系偏好', required: false, options: ['粤菜', '川菜', '东北菜', '日料', '西餐', '混合'],                  displayOrder: 2 },
      { fieldType: 'number',   fieldKey: 'guest_count', label: '用餐人数', required: true,  placeholder: '如：10',                                                        displayOrder: 3 },
      { fieldType: 'date',     fieldKey: 'event_date',  label: '活动日期', required: true,  displayOrder: 4 },
      { fieldType: 'textarea', fieldKey: 'dietary',     label: '饮食限制', required: false, placeholder: '如：素食、清真、海鲜过敏…', displayOrder: 5 },
    ],
  },
  {
    name: '其他服务', nameEn: 'Other', slug: 'other',
    icon: 'more-horizontal', color: '#6b7280', displayOrder: 12,
    fields: [
      { fieldType: 'text',     fieldKey: 'service_name', label: '服务名称', required: true,  placeholder: '请简短描述需要的服务',       displayOrder: 1 },
      { fieldType: 'textarea', fieldKey: 'description',  label: '详细说明', required: true,  placeholder: '详细描述您的需求、时间、地点等', displayOrder: 2 },
    ],
  },
] as const;

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create / update categories + form fields
  let totalFields = 0;
  for (const cat of CATEGORY_DEFS) {
    const { fields, ...catData } = cat;

    // Upsert category (upsert by name; also set slug)
    const category = await prisma.serviceCategory.upsert({
      where: { name: catData.name },
      update: {
        slug: catData.slug,
        nameEn: catData.nameEn,
        icon: catData.icon,
        color: catData.color,
        displayOrder: catData.displayOrder,
        isActive: true,
      },
      create: {
        name: catData.name,
        nameEn: catData.nameEn,
        slug: catData.slug,
        icon: catData.icon,
        color: catData.color,
        displayOrder: catData.displayOrder,
        isActive: true,
      },
    });

    // Delete existing fields and recreate (simpler than diff for seed)
    await prisma.formField.deleteMany({ where: { categoryId: category.id } });

    for (const f of fields) {
      const { options, ...fRest } = f as typeof f & { options?: string[] };
      await prisma.formField.create({
        data: {
          ...fRest,
          fieldType: fRest.fieldType as any,
          categoryId: category.id,
          optionsJson: 'options' in f && (f as any).options ? JSON.stringify((f as any).options) : null,
        },
      });
      totalFields++;
    }

    // Bridge: ensure a CustomServiceTemplate exists with id == categoryId
    // so existing POST /api/custom-requests still resolves templateId
    const existing = await prisma.customServiceTemplate.findUnique({
      where: { id: category.id },
    });
    if (!existing) {
      await prisma.customServiceTemplate.create({
        data: {
          id: category.id,
          categoryId: category.id,
          name: category.name,
          description: catData.nameEn,
          displayOrder: catData.displayOrder,
        },
      });
    }
  }

  console.log(`✅ Created 12 categories + ${totalFields} form fields`);

  // 2. Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@youfujia.com' },
    update: {},
    create: {
      email: 'admin@youfujia.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      city: 'Guelph',
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // 3. Create payment policies
  const policyDefs = [
    { serviceType: 'standard',       autoCaptureHoursBefore: 48, isAutoCaptureEnabled: true,  cancellationCutoffHours: 48, forfeiturePercentage: 20, depositPercentage: 30, refundDays: 7  },
    { serviceType: 'simple_custom',  autoCaptureHoursBefore: 36, isAutoCaptureEnabled: true,  cancellationCutoffHours: 36, forfeiturePercentage: 15, depositPercentage: 20, refundDays: 7  },
    { serviceType: 'complex_custom', autoCaptureHoursBefore: 72, isAutoCaptureEnabled: false, cancellationCutoffHours: 72, forfeiturePercentage: 25, depositPercentage: 50, refundDays: 14 },
  ];
  const policies = await Promise.all(
    policyDefs.map(async (def) => {
      const existing = await prisma.paymentPolicy.findFirst({
        where: { serviceType: def.serviceType, serviceCategoryId: null },
      });
      if (existing) return existing;
      return prisma.paymentPolicy.create({
        data: { ...def, serviceCategoryId: null, createdBy: adminUser.id },
      });
    })
  );

  console.log(`✅ Created ${policies.length} payment policies`);
  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
