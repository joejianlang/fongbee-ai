import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Default configurations for each category
const CATEGORY_CONFIGS = [
  {
    name: '全部',
    description: '显示所有来源的全部内容',
    keywords: [],
    filterType: 'ALL',
  },
  {
    name: '关注',
    description: '基于您的兴趣标签个性化推荐内容',
    keywords: [],
    filterType: 'USER_INTERESTS',
  },
  {
    name: '传统新闻媒体',
    description: '来自传统媒体机构的RSS订阅内容，包括报纸、电视台等',
    keywords: ['新闻', '报道', '媒体', '记者', '新闻稿'],
    filterType: 'RSS_SOURCE',
  },
  {
    name: 'YouTube网红',
    description: 'YouTube创作者发布的视频内容',
    keywords: ['YouTube', '视频', '博主', 'Vlog', '频道'],
    filterType: 'YOUTUBE_SOURCE',
  },
  {
    name: '网络专业媒体',
    description: '网络上的专业媒体和行业分析内容',
    keywords: ['分析', '专题', '研究', '行业', '深度', '观察'],
    filterType: 'KEYWORDS',
  },
  {
    name: '本地',
    description: '加拿大本地新闻，涵盖大多伦多地区及华人社区动态',
    keywords: ['加拿大', 'Canada', '多伦多', 'Toronto', '华人', '本地', '安省', 'Ontario', 'GTA', '温哥华', 'Vancouver'],
    filterType: 'KEYWORDS',
  },
  {
    name: '热点',
    description: '近期热门和高关注度内容',
    keywords: ['热点', '热门', '爆料', '突发', '头条', '关注'],
    filterType: 'KEYWORDS',
  },
  {
    name: '政治',
    description: '国内外政治新闻、政策解读和时事评论',
    keywords: ['政治', '政策', '政府', '选举', '议会', '总统', '总理', '外交', '国际', '制裁', '立法'],
    filterType: 'KEYWORDS',
  },
  {
    name: '科技',
    description: '科技行业动态、AI技术、互联网和数字化转型',
    keywords: ['科技', '技术', 'AI', '人工智能', '芯片', '互联网', '软件', '硬件', '苹果', '谷歌', '微软', 'OpenAI', '量子', '机器人', '5G', '半导体'],
    filterType: 'KEYWORDS',
  },
  {
    name: '财经',
    description: '经济形势、股市、加密货币和个人理财内容',
    keywords: ['经济', '股市', '金融', '投资', '理财', '加密货币', '比特币', '房产', '通胀', '利率', '央行', '贸易', '关税'],
    filterType: 'KEYWORDS',
  },
  {
    name: '文化娱乐',
    description: '影视音乐、流行文化和娱乐资讯',
    keywords: ['娱乐', '电影', '音乐', '明星', '综艺', '文化', '艺术', '游戏', '小说', '演唱会', '奥斯卡', '格莱美'],
    filterType: 'KEYWORDS',
  },
  {
    name: '体育',
    description: '国内外体育赛事、运动员动态',
    keywords: ['体育', '足球', '篮球', '网球', '冰球', 'NHL', 'NBA', 'FIFA', '奥运', '比赛', '冠军', '运动'],
    filterType: 'KEYWORDS',
  },
];

async function run() {
  try {
    // Add columns
    await pool.query(`
      ALTER TABLE public.news_categories
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS keywords    TEXT,
        ADD COLUMN IF NOT EXISTS filter_type TEXT NOT NULL DEFAULT 'KEYWORDS';
    `);
    console.log('✓ Added description / keywords / filter_type columns');

    // Update each category
    for (const cfg of CATEGORY_CONFIGS) {
      const kwJson = JSON.stringify(cfg.keywords);
      await pool.query(
        `UPDATE public.news_categories
            SET description = $1,
                keywords    = $2,
                filter_type = $3
          WHERE name = $4`,
        [cfg.description, kwJson, cfg.filterType, cfg.name]
      );
    }
    console.log('✓ Seeded category descriptions, keywords and filter types');
    console.log('✨ Done!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
