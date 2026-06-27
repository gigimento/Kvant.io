import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callProvider } from '@/lib/llm/providers';
import { buildAEOSystem, buildAEOUser, buildLLMSTxtGenerationSystem, buildLLMSTxtGenerationUser } from '@/lib/llm/prompts/aeo-foundations';
import { checkServerAccess } from '@/lib/subscription-guard';

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_API_KEY ?? '';

function parseJSON<T>(text: string, fallback: T): T {
  try { return JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()); } catch { return fallback; }
}

async function fetchUrlSafe(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    return res.ok ? await res.text() : null;
  } catch { return null; }
}

export async function POST(request: Request) {
  try {
    const { url, brand_name } = await request.json();
    if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

    const access = await checkServerAccess('aeo');
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Subscription required' }, { status: 402 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const baseUrl = url.replace(/\/$/, '');
    const [html, robotsText, llmsTxt] = await Promise.all([
      fetchUrlSafe(baseUrl),
      fetchUrlSafe(`${baseUrl}/robots.txt`),
      fetchUrlSafe(`${baseUrl}/llms.txt`),
    ]);

    const titleMatch = html?.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descMatch = html?.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*\/?>/i);
    const pageTitle = titleMatch?.[1]?.trim() || '';
    const metaDescription = descMatch?.[1]?.trim() || '';

    const aeoUser = buildAEOUser({
      url: baseUrl,
      robotsContent: robotsText || '',
      hasLLMSTxt: !!llmsTxt,
      llmsTxtContent: llmsTxt || '',
      pageTitle,
      metaDescription,
    });

    const aeoResponse = await callProvider('gemini', aeoUser, buildAEOSystem(), GOOGLE_AI_KEY);
    const analysis = parseJSON<any>(aeoResponse.content, { overall_score: 0, issues: [], summary: 'Failed to parse' });

    let llmsTxtGenerated = null;
    if (!llmsTxt) {
      const llmUser = buildLLMSTxtGenerationUser({ url: baseUrl, brandName: brand_name || '', pageTitle, metaDescription });
      const llmResponse = await callProvider('gemini', llmUser, buildLLMSTxtGenerationSystem(), GOOGLE_AI_KEY);
      llmsTxtGenerated = parseJSON<any>(llmResponse.content, null);
    }

    return NextResponse.json({
      success: true,
      analysis,
      llms_txt_exists: !!llmsTxt,
      llms_txt_current: llmsTxt || null,
      llms_txt_generated: llmsTxtGenerated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
