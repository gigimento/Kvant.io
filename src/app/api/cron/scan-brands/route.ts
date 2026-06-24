import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { callProvider, LLMProvider } from '@/lib/llm/providers';
import { buildBrandScanPrompt, buildShareOfVoicePrompt } from '@/lib/llm/prompts/seo-scan';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_API_KEY ?? '';

async function getApiKeyMap(): Promise<Record<string, string>> {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from('service_config')
    .select('key, value')
    .in('key', ['openai_api_key', 'anthropic_api_key', 'perplexity_api_key'] as any);

  const config: Record<string, string> = {};
  if (rows) {
    for (const row of rows) {
      config[row.key] = row.value;
    }
  }

  const map: Record<string, string> = {};
  if (GOOGLE_AI_KEY) map['gemini'] = GOOGLE_AI_KEY;
  if (config['openai_api_key']) map['chatgpt'] = config['openai_api_key'];
  if (config['anthropic_api_key']) map['claude'] = config['anthropic_api_key'];
  if (config['perplexity_api_key']) map['perplexity'] = config['perplexity_api_key'];
  return map;
}

function parseBrandMentionResponse(
  content: string,
  brandName: string,
): { brand_mentioned: boolean; sentiment: string } {
  const analysisSection = content.split('---ANALYSIS---')[1] || '';
  const brandSection = analysisSection.split('Brand:')[1] || '';
  const mentionedLine = brandSection.split('\n')[0] || '';
  const mentioned = mentionedLine.toLowerCase().includes('yes');
  const sentimentLine = brandSection.split('Sentiment:')[1] || '';
  const sentiment = sentimentLine.toLowerCase().includes('positive')
    ? 'positive'
    : sentimentLine.toLowerCase().includes('negative')
      ? 'negative'
      : 'neutral';
  return { brand_mentioned: mentioned, sentiment };
}

export async function GET(request: Request) {
  if (request.headers.get('x-vercel-cron') !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const apiKeyMap = await getApiKeyMap();
  const availableProviders = Object.keys(apiKeyMap) as LLMProvider[];

  if (availableProviders.length === 0) {
    return NextResponse.json({ success: false, error: 'No providers' });
  }

  const { data: monitors } = await supabase
    .from('brand_monitors')
    .select('*')
    .eq('is_active', true);

  if (!monitors?.length) {
    return NextResponse.json({ success: true, scanned: 0 });
  }

  const provider = availableProviders[0];
  const apiKey = apiKeyMap[provider];
  let scanned = 0;

  for (const monitor of monitors) {
    for (const keyword of monitor.keywords) {
      const prompt = buildBrandScanPrompt({
        brandName: monitor.brand_name,
        competitors: monitor.competitors || [],
        keyword,
      });

      try {
        const response = await callProvider(provider, prompt, '', apiKey);
        await sleep(2000);
        const { brand_mentioned, sentiment } = parseBrandMentionResponse(
          response.content,
          monitor.brand_name,
        );

        await supabase.from('brand_mentions').insert({
          monitor_id: monitor.id,
          query: keyword,
          llm_provider: provider,
          brand_mentioned,
          sentiment,
          context_snippet: response.content.slice(0, 500),
          raw_response: response.content,
        });
      } catch {}
    }

    if (monitor.keywords.length > 0) {
      try {
        const sovPrompt = buildShareOfVoicePrompt({
          brandName: monitor.brand_name,
          competitors: monitor.competitors || [],
          keyword: monitor.keywords[0],
        });
        const sovResponse = await callProvider(provider, sovPrompt, '', apiKey);
        await sleep(2000);
        await supabase.from('brand_mentions').insert({
          monitor_id: monitor.id,
          query: `[SOV] ${monitor.keywords[0]}`,
          llm_provider: provider,
          brand_mentioned: true,
          sentiment: 'neutral',
          context_snippet: sovResponse.content.slice(0, 500),
          raw_response: sovResponse.content,
        });
      } catch {}
    }

    scanned++;
  }

  return NextResponse.json({ success: true, scanned });
}
