import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callProvider } from '@/lib/llm/providers';
import {
  buildContentBriefPrompt,
  buildSERPAnalysisSystem,
  buildSERPAnalysisUser,
  buildContentGapSystem,
  buildContentGapUser,
  buildKeywordDataSystem,
} from '@/lib/llm/prompts/content-brief';
import { checkServerAccess } from '@/lib/subscription-guard';

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_API_KEY ?? '';

function parseJSON<T>(text: string, fallback: T): T {
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}

export async function POST(request: Request) {
  try {
    const { keyword, audience, goal, brand_name, competitors, industry } = await request.json();

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await checkServerAccess('content-briefs');
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Subscription required' }, { status: 402 });
    }

    // 1. Generate the brief
    const { systemPrompt, userPrompt } = buildContentBriefPrompt({ keyword, audience, goal });
    const briefResponse = await callProvider('gemini', userPrompt, systemPrompt, GOOGLE_AI_KEY);
    const brief = parseJSON<{
      title: string; outline: string[]; keyPoints: string[]; faqIdeas: { question: string; answer: string }[]; toneAndStyle: string;
    }>(briefResponse.content, { title: '', outline: [], keyPoints: [], faqIdeas: [], toneAndStyle: '' });

    // 2. SERP analysis
    let serpAnalysis = {};
    if (GOOGLE_AI_KEY) {
      const serpUser = buildSERPAnalysisUser({ keyword, brandName: brand_name, industry });
      const serpResponse = await callProvider('gemini', serpUser, buildSERPAnalysisSystem(), GOOGLE_AI_KEY);
      serpAnalysis = parseJSON(serpResponse.content, {});
    }

    // 3. Content gap analysis
    let contentGap: any[] = [];
    if (GOOGLE_AI_KEY && competitors?.length > 0) {
      const gapUser = buildContentGapUser({ brandName: brand_name || keyword, competitors, keyword, industry: industry || '' });
      const gapResponse = await callProvider('gemini', gapUser, buildContentGapSystem(), GOOGLE_AI_KEY);
      contentGap = parseJSON(gapResponse.content, []);
    }

    // 4. Keyword data
    let keywordData = {};
    if (GOOGLE_AI_KEY) {
      const kwUser = `Keyword: ${keyword}\n\nProvide keyword data. Return JSON only.`;
      const kwResponse = await callProvider('gemini', kwUser, buildKeywordDataSystem(), GOOGLE_AI_KEY);
      keywordData = parseJSON(kwResponse.content, {});
    }

    // 5. Store in database
    await supabase.from('content_briefs').insert({
      user_id: user.id,
      keyword,
      audience: audience || '',
      goal: goal || '',
      title: brief.title,
      outline: brief.outline,
      key_points: brief.keyPoints,
      faq_ideas: brief.faqIdeas,
      tone_and_style: brief.toneAndStyle,
      serp_analysis: serpAnalysis,
      content_gap: contentGap,
      keyword_data: keywordData,
    });

    return NextResponse.json({
      success: true,
      brief: {
        ...brief,
        serpAnalysis,
        contentGap,
        keywordData,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
