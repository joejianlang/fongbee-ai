import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { content, title, category } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: '内容不能为空' }, { status: 400 });
    }

    const prompt = `你是一个专业的中文文章润色助手。请对以下论坛帖子进行润色优化。

要求：
- 保持原文的核心意思和观点不变
- 改善语句通顺度和表达清晰度
- 修正语法错误
- 适当调整语气，使其更自然、易读
- 保持字数大致相当，不要过度扩展
- 保留原文中的换行段落结构
- 输出纯文本，不要加任何标题或说明

${title ? `帖子标题：${title}` : ''}
${category ? `帖子分类：${category}` : ''}

原文内容：
${content}

请直接输出润色后的正文内容：`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const polished = response.choices[0].message.content ?? '';

    return NextResponse.json({ success: true, data: { polished } });
  } catch (error) {
    console.error('AI polish error:', error);
    return NextResponse.json(
      { success: false, error: '润色失败，请稍后重试' },
      { status: 500 }
    );
  }
}
