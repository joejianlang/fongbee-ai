/**
 * GET  /api/admin/ai-config  — Load AI configuration from DB
 * POST /api/admin/ai-config  — Save AI configuration to DB
 *
 * Stores a single JSON blob under key "AI_CONFIG" in system_configs table.
 * Admin-only.
 */

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import { NextRequest, NextResponse } from 'next/server';

const CONFIG_KEY = 'AI_CONFIG';

export const DEFAULT_AI_CONFIG = {
  contentPassRule: '',
  hotTopicsKeywords: 'breaking,trending,viral,crisis,emergency,disaster,accident,shooting,fire,flood,storm,earthquake,health,covid,pandemic,death,murder,crime',
  newsCategoryConfig: '本地\n热点\n政治\n科技\n财经\n文化娱乐\n体育',
  newsCategoryDetail:
    '1. 本地：描述加拿大本地城市的新闻事件\n2. 热点：突发事件、全球重大新闻\n3. 政治：政府、选举、政策相关\n4. 科技：AI、科技产品、互联网\n5. 财经：股市、经济、商业\n6. 文化娱乐：电影、音乐、名人\n7. 体育：各类体育赛事',
  cityList:
    'Ontario: Toronto, Mississauga, Brampton, Ottawa, Hamilton\nBC: Vancouver, Richmond, Surrey, Burnaby, Kelowna\nAlberta: Calgary, Edmonton\nQuebec: Montreal, Quebec City\nManitoba: Winnipeg\nNova Scotia: Halifax',
  contentRequirement: '80-150字，涵盖核心内容，客观中立，不含广告推广',
  commentRequirement: '有深度有趣，结合时事，引发读者思考，50-100字',
  articleCommentLength: '300-500字',
  videoCommentLength: '150-250字',
  analysisLength: '800-1000字',
  aiModel: 'gpt-4o-mini',
  temperature: 0.7,
  topP: 0.9,
};

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  return session && role === 'ADMIN';
}

export async function GET() {
  if (!await checkAdmin()) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const record = await prisma.systemConfig.findUnique({ where: { key: CONFIG_KEY } });

  let config = DEFAULT_AI_CONFIG;
  if (record?.value) {
    try {
      config = { ...DEFAULT_AI_CONFIG, ...JSON.parse(record.value) };
    } catch {
      // malformed JSON — use defaults
    }
  }

  return NextResponse.json({ success: true, data: config });
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  // Merge with defaults to ensure all keys are present
  const config = { ...DEFAULT_AI_CONFIG, ...body };

  await prisma.systemConfig.upsert({
    where: { key: CONFIG_KEY },
    update: { value: JSON.stringify(config), description: 'AI configuration settings' },
    create: { key: CONFIG_KEY, value: JSON.stringify(config), description: 'AI configuration settings' },
  });

  return NextResponse.json({ success: true, data: config });
}
