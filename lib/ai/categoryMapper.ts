/**
 * Tag → Frontend Category Mapper
 *
 * Maps AI-extracted English tags to the frontend display categories
 * defined in lib/mockData.ts (CATEGORIES array).
 *
 * Priority order: first matching rule wins.
 * Falls back to '热点' if no rule matches.
 */

// ── Frontend Category Definitions ────────────────────────────────────────────

export const FRONTEND_CATEGORIES = [
  '全部', '关注', '传统新闻媒体', 'YouTube网红',
  '网络专业媒体', '本地', '热点', '政治',
  '科技', '财经', '文化娱乐', '体育',
] as const;

export type FrontendCategory = typeof FRONTEND_CATEGORIES[number];

// ── Source-type based mapping ─────────────────────────────────────────────────
// Some categories are determined by the feed source type, not tags.

export const SOURCE_TYPE_CATEGORY: Record<string, FrontendCategory> = {
  YOUTUBE: 'YouTube网红',
};

// ── Tag keyword rules ─────────────────────────────────────────────────────────
// Lower index = higher priority. First match wins.

interface CategoryRule {
  category: FrontendCategory;
  keywords: string[];  // matched against lowercase tag string
}

const CATEGORY_RULES: CategoryRule[] = [
  // 本地 — Guelph / Ontario / Canada local news
  {
    category: '本地',
    keywords: [
      'guelph', 'waterloo', 'kitchener', 'cambridge', 'ontario',
      'canada', 'canadian', 'local', 'toronto', 'ottawa', 'vancouver',
      'bc', 'alberta', 'quebec', 'nova scotia', 'community',
    ],
  },

  // 政治
  {
    category: '政治',
    keywords: [
      'politics', 'political', 'government', 'election', 'parliament',
      'senate', 'prime minister', 'liberal', 'conservative', 'ndp',
      'policy', 'legislation', 'law', 'regulation', 'federal', 'provincial',
      'cabinet', 'minister', 'trudeau', 'poilievre', 'biden', 'trump',
      'congress', 'democrat', 'republican', 'vote',
    ],
  },

  // 科技
  {
    category: '科技',
    keywords: [
      'technology', 'tech', 'ai', 'artificial intelligence', 'machine learning',
      'software', 'hardware', 'startup', 'silicon valley', 'apple', 'google',
      'microsoft', 'meta', 'openai', 'chatgpt', 'robot', 'automation',
      'cybersecurity', 'hacking', 'blockchain', 'crypto', 'web3',
      'smartphone', 'electric vehicle', 'ev', 'tesla',
    ],
  },

  // 财经
  {
    category: '财经',
    keywords: [
      'finance', 'financial', 'economy', 'economic', 'stock', 'market',
      'investment', 'banking', 'inflation', 'interest rate', 'recession',
      'gdp', 'trade', 'tariff', 'business', 'corporate', 'earnings',
      'real estate', 'housing', 'mortgage', 'tsx', 'tsx venture',
      'commodity', 'oil', 'gold', 'bitcoin',
    ],
  },

  // 文化娱乐
  {
    category: '文化娱乐',
    keywords: [
      'entertainment', 'culture', 'arts', 'music', 'film', 'movie',
      'television', 'tv', 'celebrity', 'award', 'oscar', 'grammy',
      'fashion', 'food', 'travel', 'lifestyle', 'gaming', 'esports',
      'book', 'literature', 'theatre', 'comedy', 'festival',
    ],
  },

  // 体育
  {
    category: '体育',
    keywords: [
      'sports', 'sport', 'hockey', 'nhl', 'basketball', 'nba', 'football',
      'nfl', 'soccer', 'mls', 'baseball', 'mlb', 'tennis', 'golf',
      'olympics', 'athlete', 'championship', 'league', 'playoffs',
      'toronto maple leafs', 'toronto raptors', 'blue jays',
    ],
  },

  // YouTube网红 (overridden by source type, but also tag-based)
  {
    category: 'YouTube网红',
    keywords: ['youtube', 'youtuber', 'influencer', 'content creator', 'vlog', 'channel'],
  },

  // 网络专业媒体
  {
    category: '网络专业媒体',
    keywords: [
      'analysis', 'research', 'report', 'study', 'survey',
      'expert', 'opinion', 'editorial', 'commentary',
    ],
  },

  // 热点 (catch-all for trending / breaking news)
  {
    category: '热点',
    keywords: [
      'breaking', 'trending', 'viral', 'crisis', 'emergency', 'disaster',
      'accident', 'shooting', 'fire', 'flood', 'storm', 'earthquake',
      'health', 'covid', 'pandemic', 'death', 'murder', 'crime',
    ],
  },
];

// ── Main mapping function ─────────────────────────────────────────────────────

/**
 * Map a list of extracted tags (+ optional source type) to a frontend category.
 *
 * @param tags        Array of lowercase tag strings from AI extraction
 * @param sourceType  FeedSource.type — 'RSS' | 'YOUTUBE'
 */
export function mapTagsToCategory(
  tags: string[],
  sourceType?: string | null,
): FrontendCategory {
  // 1. Source-type override (e.g., YOUTUBE always → YouTube网红)
  if (sourceType && SOURCE_TYPE_CATEGORY[sourceType]) {
    return SOURCE_TYPE_CATEGORY[sourceType];
  }

  const lowerTags = tags.map((t) => t.toLowerCase());

  // 2. Walk rules in priority order; first match wins
  for (const rule of CATEGORY_RULES) {
    for (const tag of lowerTags) {
      for (const kw of rule.keywords) {
        if (tag.includes(kw) || kw.includes(tag)) {
          return rule.category;
        }
      }
    }
  }

  // 3. Default fallback
  return '热点';
}

/**
 * Convenience: map a single tag string to a category.
 */
export function mapSingleTagToCategory(tag: string): FrontendCategory {
  return mapTagsToCategory([tag]);
}
