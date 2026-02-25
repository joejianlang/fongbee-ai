export interface MockArticle {
  id: string;
  title: string;
  sourceName: string;
  sourceType: 'RSS' | 'YOUTUBE';
  category: string;
  publishedAt: string;
  imageUrl?: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  shareCount: number;
  summary?: string;
}

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

export const MOCK_ARTICLES: MockArticle[] = [
  {
    id: 'mock-1',
    title: 'Guelph 公交车司机在撞车事故后被指控',
    sourceName: '本地新闻汇总',
    sourceType: 'RSS',
    category: '本地',
    publishedAt: hoursAgo(1),
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
    tags: ['本地', '交通'],
    viewCount: 891, likeCount: 34, shareCount: 12,
    summary: 'Guelph 一名公交车司机因涉嫌在工作期间发生事故被警方指控...',
  },
  {
    id: 'mock-2',
    title: '比尔·盖茨承认与两名俄罗斯女性有染，否认与爱泼斯坦受害者有关联',
    sourceName: '南华早报-世界新闻',
    sourceType: 'RSS',
    category: '热点',
    publishedAt: hoursAgo(2),
    imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop',
    tags: ['热点', '国际'],
    viewCount: 4521, likeCount: 203, shareCount: 87,
    summary: '比尔·盖茨在最新采访中承认...',
  },
  {
    id: 'mock-3',
    title: '特朗普在 CUSMA 审查前关税牌已用尽',
    sourceName: 'National Post',
    sourceType: 'RSS',
    category: '财经',
    publishedAt: hoursAgo(3),
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
    tags: ['财经', '政治', '加拿大'],
    viewCount: 2341, likeCount: 98, shareCount: 45,
    summary: '分析人士指出，特朗普政府在 CUSMA 贸易协议审查前...',
  },
  {
    id: 'mock-4',
    title: 'N.B. 地区继续搜寻失踪囚犯 | CTV News 2026年2月23日晚11:30新闻',
    sourceName: 'CTV NEWS',
    sourceType: 'YOUTUBE',
    category: '本地',
    publishedAt: hoursAgo(3),
    imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&h=300&fit=crop',
    tags: ['本地', '新闻'],
    viewCount: 1203, likeCount: 56, shareCount: 18,
  },
  {
    id: 'mock-5',
    title: '【2026年2月25日】新斯科舍省两名青少年因冰球欺凌被指控',
    sourceName: 'CTV NEWS',
    sourceType: 'YOUTUBE',
    category: '本地',
    publishedAt: hoursAgo(3),
    imageUrl: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=400&h=300&fit=crop',
    tags: ['本地', '社会'],
    viewCount: 876, likeCount: 41, shareCount: 9,
  },
  {
    id: 'mock-6',
    title: '川普國情咨文108分钟狂炫政绩，美媒质疑逻辑，再酸裴洛西',
    sourceName: '三立新闻',
    sourceType: 'YOUTUBE',
    category: '政治',
    publishedAt: hoursAgo(4),
    imageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=400&h=300&fit=crop',
    tags: ['政治', '美国'],
    viewCount: 5672, likeCount: 312, shareCount: 134,
  },
  {
    id: 'mock-7',
    title: 'OpenAI 发布 GPT-5：推理能力再度突破，开发者费用大幅下降',
    sourceName: 'The Verge',
    sourceType: 'RSS',
    category: '科技',
    publishedAt: hoursAgo(5),
    imageUrl: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=300&fit=crop',
    tags: ['科技', 'AI'],
    viewCount: 8934, likeCount: 567, shareCount: 231,
    summary: 'OpenAI 今日正式发布 GPT-5，在多项基准测试中领先...',
  },
  {
    id: 'mock-8',
    title: '世界棒球经典赛即将开打！啦啦队长准备客场应援',
    sourceName: '東森新聞',
    sourceType: 'YOUTUBE',
    category: '体育',
    publishedAt: hoursAgo(5),
    imageUrl: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=300&fit=crop',
    tags: ['体育', '棒球'],
    viewCount: 2109, likeCount: 143, shareCount: 52,
  },
  {
    id: 'mock-9',
    title: '永豐銀行爆發內鬼事件！前資深女經理涉嫌勾結光電商詐貸4千萬元',
    sourceName: '民視新聞網',
    sourceType: 'YOUTUBE',
    category: '财经',
    publishedAt: hoursAgo(6),
    imageUrl: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400&h=300&fit=crop',
    tags: ['财经', '犯罪'],
    viewCount: 3456, likeCount: 187, shareCount: 76,
  },
  {
    id: 'mock-10',
    title: 'Stephen A. 对 Steelers 总经理 Omar Khan 的「历批评」',
    sourceName: 'ESPN',
    sourceType: 'YOUTUBE',
    category: '体育',
    publishedAt: hoursAgo(7),
    imageUrl: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=300&fit=crop',
    tags: ['体育', 'NFL'],
    viewCount: 1876, likeCount: 92, shareCount: 31,
  },
];

export const CATEGORIES = [
  '全部', '关注', '传统新闻媒体', 'YouTube网红',
  '网络专业媒体', '本地', '热点', '政治',
  '科技', '财经', '文化娱乐', '体育',
];

/** 按分类过滤 Mock 文章 */
export function filterMockArticles(category: string): MockArticle[] {
  if (category === '全部') return MOCK_ARTICLES;
  if (category === '传统新闻媒体' || category === 'YouTube网红' || category === '网络专业媒体') {
    return MOCK_ARTICLES.filter((a) => {
      if (category === 'YouTube网红') return a.sourceType === 'YOUTUBE';
      if (category === '传统新闻媒体') return a.sourceType === 'RSS';
      return true;
    });
  }
  return MOCK_ARTICLES.filter((a) => a.category === category || a.tags.includes(category));
}
