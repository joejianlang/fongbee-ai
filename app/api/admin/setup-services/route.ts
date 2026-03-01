/**
 * POST /api/admin/setup-services
 *
 * Idempotent endpoint that initialises default service categories and
 * their form fields.  Safe to call multiple times — uses upsert for
 * categories and deleteMany+createMany for fields.
 *
 * Admin-only.
 */

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import { NextResponse } from 'next/server';
import { FormTemplateType, FormFieldType } from '@prisma/client';

// ── Field definition helper type ─────────────────────────────────────────────
interface FieldDef {
  fieldKey: string;
  fieldType: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  displayOrder: number;
}

// ── Service definitions ───────────────────────────────────────────────────────
const SERVICES: {
  slug: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  displayOrder: number;
  templateType: FormTemplateType;
  fields: FieldDef[];
}[] = [
  // ── 标准服务 ─────────────────────────────────────────────────────────────
  {
    slug: 'electrical-repair',
    name: '电路维修',
    nameEn: 'Electrical Repair',
    icon: '⚡',
    color: '#3B82F6',
    displayOrder: 10,
    templateType: 'STANDARD_SERVICE',
    fields: [
      {
        fieldKey: 'problem_type',
        fieldType: 'chips',
        label: '问题类型',
        required: true,
        options: ['插座故障', '开关故障', '灯具故障', '断路器跳闸', '电线老化', '其他'],
        displayOrder: 0,
      },
      {
        fieldKey: 'urgency',
        fieldType: 'chips',
        label: '紧急程度',
        required: true,
        options: ['不紧急', '较紧急', '非常紧急'],
        displayOrder: 1,
      },
      {
        fieldKey: 'address',
        fieldType: 'text',
        label: '服务地址',
        placeholder: '请输入详细地址',
        required: true,
        displayOrder: 2,
      },
      {
        fieldKey: 'preferred_date',
        fieldType: 'date',
        label: '希望上门日期',
        required: false,
        displayOrder: 3,
      },
      {
        fieldKey: 'problem_desc',
        fieldType: 'textarea',
        label: '问题描述',
        placeholder: '请详细描述问题情况，有助于师傅更快解决...',
        required: false,
        displayOrder: 4,
      },
    ],
  },

  {
    slug: 'plumbing-repair',
    name: '水路维修',
    nameEn: 'Plumbing Repair',
    icon: '🔧',
    color: '#06B6D4',
    displayOrder: 20,
    templateType: 'STANDARD_SERVICE',
    fields: [
      {
        fieldKey: 'problem_type',
        fieldType: 'chips',
        label: '问题类型',
        required: true,
        options: ['水管漏水', '马桶堵塞', '水龙头故障', '排水不畅', '热水器问题', '其他'],
        displayOrder: 0,
      },
      {
        fieldKey: 'urgency',
        fieldType: 'chips',
        label: '紧急程度',
        required: true,
        options: ['不紧急', '较紧急', '非常紧急'],
        displayOrder: 1,
      },
      {
        fieldKey: 'address',
        fieldType: 'text',
        label: '服务地址',
        placeholder: '请输入详细地址',
        required: true,
        displayOrder: 2,
      },
      {
        fieldKey: 'preferred_date',
        fieldType: 'date',
        label: '希望上门日期',
        required: false,
        displayOrder: 3,
      },
      {
        fieldKey: 'problem_desc',
        fieldType: 'textarea',
        label: '问题描述',
        placeholder: '请详细描述问题情况，例如漏水位置、频率等...',
        required: false,
        displayOrder: 4,
      },
    ],
  },

  {
    slug: 'tax-filing',
    name: '报税服务',
    nameEn: 'Tax Filing',
    icon: '📊',
    color: '#8B5CF6',
    displayOrder: 30,
    templateType: 'STANDARD_SERVICE',
    fields: [
      {
        fieldKey: 'tax_year',
        fieldType: 'select',
        label: '报税年份',
        required: true,
        options: ['2024', '2023', '2022', '2021', '2020'],
        displayOrder: 0,
      },
      {
        fieldKey: 'family_status',
        fieldType: 'chips',
        label: '家庭状态',
        required: true,
        options: ['单身', '已婚/同居', '有孩子'],
        displayOrder: 1,
      },
      {
        fieldKey: 'income_sources',
        fieldType: 'multichips',
        label: '收入来源',
        required: true,
        options: ['T4工资', '自雇收入', '投资收益', '房租收入', '海外收入', 'EI/CERB'],
        displayOrder: 2,
      },
      {
        fieldKey: 'special_case',
        fieldType: 'multichips',
        label: '特殊情况',
        required: false,
        options: ['首次报税', '补报往年', '有境外资产', '自雇/小生意', 'RRSP供款', 'First Home Buyer'],
        displayOrder: 3,
      },
      {
        fieldKey: 'notes',
        fieldType: 'textarea',
        label: '补充说明',
        placeholder: '如有其他特殊情况请在此说明...',
        required: false,
        displayOrder: 4,
      },
    ],
  },

  {
    slug: 'boiler-replacement',
    name: '更换暖气锅炉',
    nameEn: 'Boiler Replacement',
    icon: '🔥',
    color: '#F59E0B',
    displayOrder: 40,
    templateType: 'STANDARD_SERVICE',
    fields: [
      {
        fieldKey: 'house_type',
        fieldType: 'chips',
        label: '房屋类型',
        required: true,
        options: ['公寓', '独立屋', '半独立屋', '联排别墅'],
        displayOrder: 0,
      },
      {
        fieldKey: 'floor_area',
        fieldType: 'chips',
        label: '房屋面积',
        required: true,
        options: ['<1000 sqft', '1000-1500 sqft', '1500-2000 sqft', '>2000 sqft'],
        displayOrder: 1,
      },
      {
        fieldKey: 'current_model',
        fieldType: 'text',
        label: '现有锅炉型号',
        placeholder: '如不清楚可留空',
        required: false,
        displayOrder: 2,
      },
      {
        fieldKey: 'preferred_date',
        fieldType: 'date',
        label: '希望上门日期',
        required: false,
        displayOrder: 3,
      },
      {
        fieldKey: 'notes',
        fieldType: 'textarea',
        label: '补充说明',
        placeholder: '请描述锅炉现状或特殊要求...',
        required: false,
        displayOrder: 4,
      },
    ],
  },

  {
    slug: 'water-heater-replacement',
    name: '更换热水器',
    nameEn: 'Water Heater Replacement',
    icon: '🚿',
    color: '#10B981',
    displayOrder: 50,
    templateType: 'STANDARD_SERVICE',
    fields: [
      {
        fieldKey: 'heater_type',
        fieldType: 'chips',
        label: '热水器类型',
        required: true,
        options: ['燃气热水器', '电热水器', '热泵热水器', '储热式', '即热式'],
        displayOrder: 0,
      },
      {
        fieldKey: 'current_issue',
        fieldType: 'chips',
        label: '更换原因',
        required: true,
        options: ['不出热水', '水温不稳', '有异响', '漏水', '定期更换'],
        displayOrder: 1,
      },
      {
        fieldKey: 'house_type',
        fieldType: 'chips',
        label: '房屋类型',
        required: false,
        options: ['公寓', '独立屋', '半独立屋'],
        displayOrder: 2,
      },
      {
        fieldKey: 'preferred_date',
        fieldType: 'date',
        label: '希望上门日期',
        required: false,
        displayOrder: 3,
      },
      {
        fieldKey: 'notes',
        fieldType: 'textarea',
        label: '补充说明',
        placeholder: '请描述热水器现状或特殊要求...',
        required: false,
        displayOrder: 4,
      },
    ],
  },

  // ── 简单定制服务 ──────────────────────────────────────────────────────────
  {
    slug: 'bathroom-renovation',
    name: '卫生间更新',
    nameEn: 'Bathroom Renovation',
    icon: '🛁',
    color: '#EC4899',
    displayOrder: 60,
    templateType: 'SIMPLE_CUSTOM',
    fields: [
      {
        fieldKey: 'renovation_scope',
        fieldType: 'multichips',
        label: '翻新范围',
        required: true,
        options: ['瓷砖翻新', '洁具更换', '防水处理', '灯具更新', '镜柜安装', '全面翻新'],
        displayOrder: 0,
      },
      {
        fieldKey: 'bathroom_size',
        fieldType: 'chips',
        label: '卫生间大小',
        required: true,
        options: ['小型 (<50 sqft)', '中型 (50-80 sqft)', '大型 (>80 sqft)'],
        displayOrder: 1,
      },
      {
        fieldKey: 'budget_range',
        fieldType: 'chips',
        label: '预算范围',
        required: true,
        options: ['$1,000-3,000', '$3,000-6,000', '$6,000-10,000', '$10,000以上'],
        displayOrder: 2,
      },
      {
        fieldKey: 'timeline',
        fieldType: 'chips',
        label: '施工时间',
        required: false,
        options: ['尽快开始', '1个月内', '3个月内', '时间灵活'],
        displayOrder: 3,
      },
      {
        fieldKey: 'has_design',
        fieldType: 'chips',
        label: '设计方案',
        required: false,
        options: ['已有设计图', '需要设计建议', '暂未确定'],
        displayOrder: 4,
      },
      {
        fieldKey: 'notes',
        fieldType: 'textarea',
        label: '详细需求描述',
        placeholder: '请描述您的翻新需求、风格偏好或特殊要求...',
        required: false,
        displayOrder: 5,
      },
    ],
  },

  {
    slug: 'kitchen-renovation',
    name: '厨房更新',
    nameEn: 'Kitchen Renovation',
    icon: '🍳',
    color: '#F97316',
    displayOrder: 70,
    templateType: 'SIMPLE_CUSTOM',
    fields: [
      {
        fieldKey: 'renovation_scope',
        fieldType: 'multichips',
        label: '翻新范围',
        required: true,
        options: ['橱柜更换', '台面更换', '水槽/龙头', '地板翻新', '电器更新', '全面翻新'],
        displayOrder: 0,
      },
      {
        fieldKey: 'kitchen_size',
        fieldType: 'chips',
        label: '厨房大小',
        required: true,
        options: ['小型 (<100 sqft)', '中型 (100-150 sqft)', '大型 (>150 sqft)'],
        displayOrder: 1,
      },
      {
        fieldKey: 'budget_range',
        fieldType: 'chips',
        label: '预算范围',
        required: true,
        options: ['$3,000-8,000', '$8,000-15,000', '$15,000-30,000', '$30,000以上'],
        displayOrder: 2,
      },
      {
        fieldKey: 'timeline',
        fieldType: 'chips',
        label: '施工时间',
        required: false,
        options: ['尽快开始', '1个月内', '3个月内', '时间灵活'],
        displayOrder: 3,
      },
      {
        fieldKey: 'has_design',
        fieldType: 'chips',
        label: '设计方案',
        required: false,
        options: ['已有设计图', '需要设计建议', '暂未确定'],
        displayOrder: 4,
      },
      {
        fieldKey: 'notes',
        fieldType: 'textarea',
        label: '详细需求描述',
        placeholder: '请描述您的翻新需求、风格偏好或特殊要求...',
        required: false,
        displayOrder: 5,
      },
    ],
  },
];

// ── Handler ────────────────────────────────────────────────────────────────────
export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let categoriesUpserted = 0;
  let fieldsCreated = 0;
  const errors: string[] = [];

  for (const svc of SERVICES) {
    try {
      // 1. Upsert category
      const cat = await prisma.serviceCategory.upsert({
        where: { slug: svc.slug },
        update: {
          name: svc.name,
          nameEn: svc.nameEn,
          icon: svc.icon,
          color: svc.color,
          displayOrder: svc.displayOrder,
          isActive: true,
        },
        create: {
          name: svc.name,
          nameEn: svc.nameEn,
          slug: svc.slug,
          icon: svc.icon,
          color: svc.color,
          displayOrder: svc.displayOrder,
          isActive: true,
        },
      });
      categoriesUpserted++;

      // 2. Replace fields for this category + templateType
      await prisma.formField.deleteMany({
        where: { categoryId: cat.id, templateType: svc.templateType },
      });

      await prisma.formField.createMany({
        data: svc.fields.map((f) => ({
          categoryId: cat.id,
          templateType: svc.templateType,
          fieldType: f.fieldType,
          fieldKey: f.fieldKey,
          label: f.label,
          placeholder: f.placeholder ?? null,
          required: f.required,
          optionsJson: f.options ? JSON.stringify(f.options) : null,
          displayOrder: f.displayOrder,
        })),
      });
      fieldsCreated += svc.fields.length;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${svc.name}: ${msg}`);
    }
  }

  return NextResponse.json({
    success: true,
    categoriesUpserted,
    fieldsCreated,
    errors,
    message: `已初始化 ${categoriesUpserted} 个服务分类，共 ${fieldsCreated} 个表单字段${errors.length ? `（${errors.length} 个错误）` : ''}`,
  });
}
