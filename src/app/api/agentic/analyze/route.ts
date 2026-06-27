import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callProvider } from '@/lib/llm/providers';
import { buildAgenticReadinessSystem, buildAgenticReadinessUser } from '@/lib/llm/prompts/agentic-readiness';
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
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

    const access = await checkServerAccess('agentic');
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Subscription required' }, { status: 402 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const html = await fetchUrlSafe(url);
    if (!html) return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 });

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descMatch = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*\/?>/i);
    const canonicalMatch = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*\/?>/i);
    const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
    const scriptContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    const textContent = scriptContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const structuredDataBlocks = [...html.matchAll(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

    const pageTitle = titleMatch?.[1]?.trim() || '';
    const metaDescription = descMatch?.[1]?.trim() || '';
    const h1s = h1Matches.map((m) => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);

    const userPrompt = buildAgenticReadinessUser({
      url,
      pageTitle,
      metaDescription,
      hasStructuredData: structuredDataBlocks.length > 0,
      wordCount: textContent.split(/\s+/).length,
      h1Tags: h1s,
      hasCanonical: !!canonicalMatch,
    });

    const response = await callProvider('gemini', userPrompt, buildAgenticReadinessSystem(), GOOGLE_AI_KEY);
    const analysis = parseJSON<any>(response.content, { overall_score: 0, friction_points: [], summary: 'Failed to parse' });

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
