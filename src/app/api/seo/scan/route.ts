import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { callProvider, LLMProvider, PROVIDER_CONFIG_KEY } from '@/lib/llm/providers';
import {
  buildBrandScanPrompt,
  buildShareOfVoicePrompt,
  buildTechSEOAnalysisSystem,
  buildTechSEOAnalysisUser,
  buildKeywordResearchSystem,
  buildKeywordResearchUser,
  buildOnPageAnalysisSystem,
  buildOnPageAnalysisUser,
} from '@/lib/llm/prompts/seo-scan';
import { checkServerAccess } from '@/lib/subscription-guard';

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_API_KEY ?? '';
const ALL_PROVIDERS: LLMProvider[] = ['chatgpt', 'claude', 'gemini', 'perplexity'];

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

function extractHtmlMeta(html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const descMatch = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*\/?>/i);
  const viewportMatch = html.match(/<meta\s+[^>]*name=["']viewport["'][^>]*\/?>/i);
  const canonicalMatch = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*\/?>/i);
  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h2Matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
  const imgMatches = [...html.matchAll(/<img[^>]*>/gi)];
  const linkMatches = [...html.matchAll(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>/gi)];
  const scriptContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  const styleContent = scriptContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  const textContent = styleContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const imagesWithoutAlt = imgMatches.filter((img) => {
    const tag = img[0];
    return !/alt\s*=/i.test(tag);
  }).length;

  let internalLinks = 0;
  let externalLinks = 0;
  const url = '';
  for (const link of linkMatches) {
    const href = link[1];
    if (href.startsWith('http') || href.startsWith('//')) {
      externalLinks++;
    } else if (!href.startsWith('#') && !href.startsWith('javascript:')) {
      internalLinks++;
    }
  }

  const h1s = h1Matches.map((m) => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  const h2s = h2Matches.map((m) => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);

  const structuredDataBlocks = [...html.matchAll(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  return {
    pageTitle: titleMatch ? titleMatch[1].trim() : '',
    metaDescription: descMatch ? descMatch[1].trim() : '',
    h1Tags: h1s,
    h2Tags: h2s,
    hasViewportMeta: !!viewportMatch,
    hasCanonical: !!canonicalMatch,
    hasStructuredData: structuredDataBlocks.length > 0,
    wordCount: textContent.split(/\s+/).length,
    internalLinks,
    externalLinks,
    imagesWithoutAlt,
  };
}

async function fetchUrlSafe(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (res.ok) return await res.text();
  } catch {}
  return null;
}

function parseBrandMentionResponse(
  content: string,
  brandName: string,
): { brand_mentioned: boolean; sentiment: string } {
  const lower = content.toLowerCase();
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

export async function POST(request: Request) {
  try {
    const { monitorId } = await request.json();
    if (!monitorId) {
      return NextResponse.json({ error: 'monitorId required' }, { status: 400 });
    }

    const access = await checkServerAccess('seo');
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Subscription required' }, { status: 402 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: monitor } = await supabase
      .from('brand_monitors')
      .select('*')
      .eq('id', monitorId)
      .single();

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    const apiKeyMap = await getApiKeyMap();
    const availableProviders = Object.keys(apiKeyMap) as LLMProvider[];
    const keywords = monitor.keywords || [];
    const brandName = monitor.brand_name;
    const competitors = monitor.competitors || [];
    const websiteUrl = monitor.website_url || '';
    const industry = monitor.industry || '';

    if (availableProviders.length === 0) {
      return NextResponse.json({ error: 'No AI providers available' }, { status: 500 });
    }

    const mentionResults: any[] = [];

    // 1. Multi-provider mention scan
    for (const keyword of keywords) {
      const prompt = buildBrandScanPrompt({ brandName, competitors, keyword });

      const providerResults = await Promise.all(
        availableProviders.map(async (provider) => {
          const apiKey = apiKeyMap[provider];
          if (!apiKey) return null;

          try {
            const response = await callProvider(provider, prompt, '', apiKey);
            const { brand_mentioned, sentiment } = parseBrandMentionResponse(
              response.content,
              brandName,
            );

            return {
              query: keyword,
              llm_provider: provider,
              brand_mentioned,
              sentiment,
              context_snippet: response.content.slice(0, 500),
              raw_response: response.content,
            };
          } catch (err: any) {
            console.error(`[SEO Scan] ${provider} failed for "${keyword}":`, err.message);
            return {
              query: keyword,
              llm_provider: provider,
              brand_mentioned: false,
              sentiment: 'neutral',
              context_snippet: '',
              raw_response: '',
              error: err.message,
            };
          }
        }),
      );

      for (const result of providerResults) {
        if (result) {
          await supabase.from('brand_mentions').insert({
            monitor_id: monitorId,
            query: result.query,
            llm_provider: result.llm_provider,
            brand_mentioned: result.brand_mentioned,
            sentiment: result.sentiment,
            context_snippet: result.context_snippet,
            raw_response: result.raw_response,
          });
          mentionResults.push(result);
        }
      }
    }

    // Share of voice scan on first keyword
    if (keywords.length > 0) {
      const sovProvider = availableProviders[0];
      const sovKey = apiKeyMap[sovProvider];
      if (sovKey) {
        try {
          const sovPrompt = buildShareOfVoicePrompt({
            brandName,
            competitors,
            keyword: keywords[0],
          });
          const sovResponse = await callProvider(sovProvider, sovPrompt, '', sovKey);
          await supabase.from('brand_mentions').insert({
            monitor_id: monitorId,
            query: `[SOV] ${keywords[0]}`,
            llm_provider: sovProvider,
            brand_mentioned: true,
            sentiment: 'neutral',
            context_snippet: sovResponse.content.slice(0, 500),
            raw_response: sovResponse.content,
          });
        } catch {}
      }
    }

    // Calculate platform breakdown
    const platformBreakdown: Record<string, { total: number; mentioned: number }> = {};
    for (const r of mentionResults) {
      if (!platformBreakdown[r.llm_provider]) {
        platformBreakdown[r.llm_provider] = { total: 0, mentioned: 0 };
      }
      platformBreakdown[r.llm_provider].total++;
      if (r.brand_mentioned) platformBreakdown[r.llm_provider].mentioned++;
    }

    const scanData: any = {
      mention_scan: {
        total_queries: mentionResults.length,
        brand_mentions: mentionResults.filter((r) => r.brand_mentioned).length,
        overall_mention_rate: mentionResults.length > 0
          ? Math.round((mentionResults.filter((r) => r.brand_mentioned).length / mentionResults.length) * 100)
          : 0,
        platform_breakdown: Object.entries(platformBreakdown).map(([platform, stats]) => ({
          platform,
          total: stats.total,
          mentioned: stats.mentioned,
          rate: stats.total > 0 ? Math.round((stats.mentioned / stats.total) * 100) : 0,
        })),
        scanned_at: new Date().toISOString(),
      },
    };

    // 2. Technical SEO audit (if website_url exists)
    if (websiteUrl) {
      try {
        const html = await fetchUrlSafe(websiteUrl);
        if (html) {
          const meta = extractHtmlMeta(html);

          const robotsHtml = await fetchUrlSafe(`${websiteUrl.replace(/\/$/, '')}/robots.txt`);
          let sitemapUrls: string[] = [];
          const sitemapHtml = await fetchUrlSafe(`${websiteUrl.replace(/\/$/, '')}/sitemap.xml`);
          if (sitemapHtml) {
            const urlMatches = [...sitemapHtml.matchAll(/<loc>([^<]+)<\/loc>/gi)];
            sitemapUrls = urlMatches.map((m) => m[1]);
          }

          const isHTTPS = websiteUrl.startsWith('https://');

          if (GOOGLE_AI_KEY) {
            const techUser = buildTechSEOAnalysisUser({
              url: websiteUrl,
              ...meta,
              isHTTPS,
              robotsContent: robotsHtml || '',
              sitemapUrls,
            });

            const techResponse = await callProvider('gemini', techUser, buildTechSEOAnalysisSystem(), GOOGLE_AI_KEY);

            try {
              const cleaned = techResponse.content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              scanData.technical = JSON.parse(cleaned);
            } catch {
              scanData.technical = { overall_score: 0, issues: [], summary: 'Failed to parse audit' };
            }
          }

          // Store raw tech data for UI
          scanData.technical = {
            ...(scanData.technical || {}),
            page_title: meta.pageTitle,
            meta_description: meta.metaDescription,
            word_count: meta.wordCount,
            h1_count: meta.h1Tags.length,
            h2_count: meta.h2Tags.length,
            internal_links: meta.internalLinks,
            external_links: meta.externalLinks,
            images_missing_alt: meta.imagesWithoutAlt,
            has_structured_data: meta.hasStructuredData,
            has_viewport: meta.hasViewportMeta,
            has_canonical: meta.hasCanonical,
            is_https: isHTTPS,
          };

          // 3. On-page analysis (if tech scan succeeded)
          if (keywords.length > 0 && meta.pageTitle && GOOGLE_AI_KEY) {
            try {
              const onPageUser = buildOnPageAnalysisUser({
                url: websiteUrl,
                title: meta.pageTitle,
                metaDescription: meta.metaDescription,
                h1Tags: meta.h1Tags,
                h2Tags: meta.h2Tags,
                wordCount: meta.wordCount,
                imagesWithoutAlt: meta.imagesWithoutAlt,
                brandName,
                keyword: keywords[0],
              });

              const onPageResponse = await callProvider(
                'gemini',
                onPageUser,
                buildOnPageAnalysisSystem(),
                GOOGLE_AI_KEY,
              );

              try {
                const cleaned = onPageResponse.content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                scanData.onpage = JSON.parse(cleaned);
              } catch {
                scanData.onpage = [];
              }
            } catch {}
          }
        }
      } catch (err) {
        console.error('[SEO Scan] Technical audit failed:', err);
        scanData.technical = { error: 'Failed to fetch website' };
      }
    }

    // 4. Keyword research (if industry exists)
    if (industry || competitors.length > 0) {
      try {
        const kwUser = buildKeywordResearchUser({
          brandName,
          competitors,
          industry,
          existingKeywords: keywords,
        });

        if (GOOGLE_AI_KEY) {
          const kwResponse = await callProvider('gemini', kwUser, buildKeywordResearchSystem(), GOOGLE_AI_KEY);

          try {
            const cleaned = kwResponse.content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const suggestions = JSON.parse(cleaned);
            if (Array.isArray(suggestions) && suggestions.length > 0) {
              await supabase
                .from('brand_monitors')
                .update({ keyword_suggestions: suggestions })
                .eq('id', monitorId);
            }
          } catch {
            console.error('[SEO Scan] Failed to parse keyword suggestions');
          }
        }
      } catch (err) {
        console.error('[SEO Scan] Keyword research failed:', err);
      }
    }

    // Store scan data on monitor
    await supabase
      .from('brand_monitors')
      .update({ seo_scan_data: scanData } as any)
      .eq('id', monitorId);

    return NextResponse.json({
      success: true,
      mention_results: mentionResults,
      seo_scan: scanData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
