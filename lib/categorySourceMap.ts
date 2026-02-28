/**
 * 分类与新闻来源的映射关系
 * 每个分类对应一个或多个新闻来源，第一个为主来源
 */

export const CATEGORY_SOURCE_MAP: Record<string, string[]> = {
  // 特殊分类，不需要映射
  '全部': [],
  '关注': [],

  // RSS 新闻媒体
  '传统新闻媒体': ['national-post', 'cnn', 'cbc'],

  // YouTube 内容创作者
  'YouTube网红': ['youtube-channel-1', 'youtube-channel-2'],

  // 网络专业媒体
  '网络专业媒体': ['verge', 'techcrunch', 'axios'],

  // 话题分类（映射到主要来源）
  '本地': ['national-post'],
  '热点': ['cnn'],
  '政治': ['cbc'],
  '科技': ['verge'],
  '财经': ['bloomberg'],
  '文化娱乐': ['variety'],
  '体育': ['espn'],
};

/**
 * 获取分类的主要来源（首个）
 * @param category 分类名称
 * @returns 来源ID，如果分类不存在或无映射则返回 null
 */
export function getPrimarySourceForCategory(category: string): string | null {
  const sources = CATEGORY_SOURCE_MAP[category];
  return sources && sources.length > 0 ? sources[0] : null;
}

/**
 * 获取分类的所有来源
 * @param category 分类名称
 * @returns 来源ID数组
 */
export function getSourcesForCategory(category: string): string[] {
  return CATEGORY_SOURCE_MAP[category] ?? [];
}

/**
 * 是否是特殊分类（需要多文章feed而不是来源详情页）
 * @param category 分类名称
 * @returns true 如果是特殊分类
 */
export function isSpecialCategory(category: string): boolean {
  return category === '全部' || category === '关注';
}
