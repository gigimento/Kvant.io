import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkServerAccess } from '@/lib/subscription-guard';
import { callProvider, LLMProvider, PROVIDER_CONFIG_KEY } from '@/lib/llm/providers';
import {
  buildPromptGenerationSystem,
  buildPromptGenerationUser,
  buildCitationAnalysisSystem,
  buildCitationAnalysisUser,
  buildFixPackSystem,
  buildFixPackUser,
} from '@/lib/llm/prompts/citation-audit';

const ALL_PROVIDERS: LLMProvider[] = ['chatgpt', 'claude', 'gemini', 'perplexity'];
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_API_KEY ?? '';

const CATEGORIES = ['recommendation', 'comparison', 'informational', 'review'];

async function getProviderApiKey(provider: LLMProvider, config: Record<string, string>): Promise<string | null> {
  if (provider === 'gemini') return GOOGLE_AI_KEY || null;
  const keyName = PROVIDER_CONFIG_KEY[provider];
  return config[keyName] || null;
}

function parseJSON<T>(text: string, fallback: T): T {
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}

export async function POST(request: Request) {
  const access = await checkServerAccess('citation-audit');
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason }, { status: 402 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const brandName: string = body.brand_name?.trim();
  const competitors: string[] = body.competitors ?? [];
  const industry: string = body.industry ?? '';

  if (!brandName) {
    return NextResponse.json({ error: 'brand_name is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: configRows } = await admin
    .from('service_config')
    .select('key, value')
    .in('key', ['openai_api_key', 'anthropic_api_key', 'perplexity_api_key'] as any);

  const config: Record<string, string> = {};
  if (configRows) {
    for (const row of configRows) {
      config[row.key] = row.value;
    }
  }

  const keyResults = await Promise.all(
    ALL_PROVIDERS.map(async (p) => ({
      provider: p,
      key: await getProviderApiKey(p, config),
    })),
  );

  const availableProviders = keyResults
    .filter((kr) => kr.key && kr.key.length > 0)
    .map((kr) => kr.provider);

  const apiKeyMap: Record<string, string> = {};
  for (const kr of keyResults) {
    if (kr.key) apiKeyMap[kr.provider] = kr.key;
  }

  if (availableProviders.length === 0) {
    return NextResponse.json({ error: 'No AI provider keys configured' }, { status: 500 });
  }

  const { data: audit, error: insertError } = await supabase
    .from('citation_audits')
    .insert({
      user_id: user.id,
      brand_name: brandName,
      competitors,
      industry,
      status: 'running',
      prompts_executed: 20,
    })
    .select('id')
    .single();

  if (insertError || !audit) {
    return NextResponse.json({ error: 'Failed to create audit' }, { status: 500 });
  }

  const auditId = audit.id;

  const genSystem = buildPromptGenerationSystem();
  const genUser = buildPromptGenerationUser(brandName, competitors, industry);

  const geminiKey = GOOGLE_AI_KEY;
  let prompts: { text: string; category: string }[] = [];
  if (geminiKey) {
    try {
      const genResponse = await callProvider('gemini', genUser, genSystem, geminiKey);
      prompts = parseJSON(genResponse.content, []);
    } catch (err) {
      console.error('Prompt generation failed:', err);
    }
  }

  if (prompts.length < 20) {
    const fallback: { text: string; category: string }[] = [];
    for (let i = 0; i < 20; i++) {
      const cat = CATEGORIES[i % CATEGORIES.length];
      fallback.push({ text: `Best ${industry || brandName} solution for ${cat === 'recommendation' ? 'professional use' : cat === 'comparison' ? `comparing ${brandName} with alternatives` : cat === 'informational' ? `understanding ${brandName} features` : `${brandName} review and rating`}`, category: cat });
    }
    prompts = fallback;
  }

  const analysisSystem = buildCitationAnalysisSystem();
  const errors: string[] = [];
  const results: any[] = [];

  for (let pi = 0; pi < Math.min(prompts.length, 20); pi++) {
    const prompt = prompts[pi];
    for (const provider of availableProviders) {
      const apiKey = apiKeyMap[provider];
      if (!apiKey) continue;

      const startTime = Date.now();
      try {
        const systemMsg = provider === 'gemini'
          ? `You are a helpful assistant. Answer the following question concisely.`
          : `You are a helpful assistant. Answer the following question naturally and concisely.`;

        const response = await callProvider(provider, prompt.text, systemMsg, apiKey);
        const latency = Date.now() - startTime;

        const analysisResponse = await callProvider(
          'gemini',
          buildCitationAnalysisUser(brandName, competitors, prompt.text, response.content),
          analysisSystem,
          GOOGLE_AI_KEY,
        );

        const analysis = parseJSON<{ brand_mentioned: boolean; competitors_mentioned: string[]; snippet: string }>(
          analysisResponse.content,
          { brand_mentioned: false, competitors_mentioned: [], snippet: '' },
        );

        results.push({
          audit_id: auditId,
          prompt_index: pi,
          prompt_text: prompt.text,
          prompt_category: prompt.category,
          platform: provider,
          brand_mentioned: analysis.brand_mentioned,
          competitors_mentioned: analysis.competitors_mentioned,
          citation_snippet: analysis.snippet,
          platform_response_raw: response.content.slice(0, 2000),
          latency_ms: latency,
        });
      } catch (err: any) {
        errors.push(`${provider}/${pi}: ${err.message}`);
        results.push({
          audit_id: auditId,
          prompt_index: pi,
          prompt_text: prompt.text,
          prompt_category: prompt.category,
          platform: provider,
          brand_mentioned: false,
          competitors_mentioned: [],
          citation_snippet: '',
          platform_response_raw: '',
          latency_ms: Date.now() - startTime,
        });
      }
    }
  }

  if (results.length > 0) {
    const admin2 = createAdminClient();
    await admin2.from('citation_results').insert(results as any);
  }

  const totalPrompts = results.length;
  const brandMentions = results.filter((r) => r.brand_mentioned).length;
  const overallRate = totalPrompts > 0 ? Math.round((brandMentions / totalPrompts) * 100) : 0;

  const platformStats: Record<string, { total: number; mentioned: number }> = {};
  for (const r of results) {
    if (!platformStats[r.platform]) platformStats[r.platform] = { total: 0, mentioned: 0 };
    platformStats[r.platform].total++;
    if (r.brand_mentioned) platformStats[r.platform].mentioned++;
  }

  const platformBreakdown = Object.entries(platformStats).map(([platform, stats]) => ({
    platform,
    citation_rate: stats.total > 0 ? Math.round((stats.mentioned / stats.total) * 100) : 0,
    total_queries: stats.total,
    mentions: stats.mentioned,
  }));

  let summary: any = {
    overall_citation_rate: overallRate,
    total_queries: totalPrompts,
    brand_mentions: brandMentions,
    platform_breakdown: platformBreakdown,
    errors: errors.length,
  };

  if (overallRate < 100 && brandMentions > 0) {
    try {
      const resultsSummary = JSON.stringify({
        overall_rate: overallRate,
        platform_breakdown: platformBreakdown,
        total_prompts: totalPrompts,
        brand_mentions: brandMentions,
      });

      const fixPackResponse = await callProvider(
        'gemini',
        buildFixPackUser(brandName, competitors, resultsSummary),
        buildFixPackSystem(),
        GOOGLE_AI_KEY,
      );

      const fixPack = parseJSON<any>(fixPackResponse.content, null);
      if (fixPack) {
        summary.fix_pack = fixPack;
      }
    } catch (err) {
      console.error('Fix pack generation failed:', err);
    }
  }

  await supabase
    .from('citation_audits')
    .update({
      status: 'ready',
      summary,
      completed_at: new Date().toISOString(),
      error_message: errors.length > 0 ? errors.join('; ') : null,
    })
    .eq('id', auditId);

  return NextResponse.json({
    success: true,
    audit_id: auditId,
    summary,
  });
}
