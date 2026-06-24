export function buildContentBriefPrompt(data: {
  keyword: string
  audience?: string
  goal?: string
}): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are an expert SEO content strategist. You create detailed, actionable content briefs that help writers produce high-quality, ranking content.

Return your response as valid JSON with this exact structure:
{
  "title": "Suggested article title (catchy, SEO-optimized)",
  "outline": ["Section 1 heading", "Section 2 heading", "Section 3 heading"],
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "faqIdeas": [
    { "question": "FAQ question?", "answer": "Brief answer" }
  ],
  "toneAndStyle": "Description of the recommended tone and style"
}`

  const userPrompt = `Generate a content brief for the following:

Target Keyword: ${data.keyword}
${data.audience ? `Target Audience: ${data.audience}` : ""}
${data.goal ? `Content Goal: ${data.goal}` : ""}

Provide the JSON response as specified.`

  return { systemPrompt, userPrompt }
}

export function buildSERPAnalysisSystem(): string {
  return `You are an SEO analyst simulating search engine results analysis. Based on the given keyword and brand context, provide SERP insights.
Return ONLY a JSON object with keys:
- "search_intent" ("informational"|"commercial"|"transactional"|"navigational")
- "featured_snippet_opportunity" (boolean)
- "people_also_ask" (string[], max 5 questions)
- "related_searches" (string[], max 5)
- "top_ranking_content_types" (string[], e.g., ["listicle", "guide", "review"])
- "estimated_difficulty" ("easy"|"medium"|"hard")
- "opportunity_brief" (string, max 150 chars)

No markdown, no extra text.`;
}

export function buildSERPAnalysisUser(params: {
  keyword: string;
  brandName?: string;
  industry?: string;
}): string {
  return `Keyword: ${params.keyword}
Brand: ${params.brandName || 'Not specified'}
Industry: ${params.industry || 'Not specified'}

Provide SERP analysis. Return JSON only.`;
}

export function buildContentGapSystem(): string {
  return `You are a content gap analyst. Compare a brand's content against competitors and identify content opportunities.
Return ONLY a JSON array of objects with keys:
- "topic" (string)
- "competitors_covering_it" (string[])
- "importance" ("high"|"medium"|"low")
- "content_format" ("blog"|"video"|"guide"|"infographic"|"case study")
- "quick_win" (boolean)

Max 8 items. No markdown, no extra text.`;
}

export function buildContentGapUser(params: {
  brandName: string;
  competitors: string[];
  keyword: string;
  industry: string;
}): string {
  return `Brand: ${params.brandName}
Competitors: ${params.competitors.join(', ') || 'None'}
Keyword: ${params.keyword}
Industry: ${params.industry || 'Not specified'}

Identify content gaps. Return JSON array only.`;
}

export function buildKeywordDataSystem(): string {
  return `You are an SEO keyword analyst. Provide detailed keyword data for the given term.
Return ONLY a JSON object with keys:
- "monthly_search_volume_estimate" ("low"|"medium"|"high"|"very_high")
- "trend" ("rising"|"stable"|"declining")
- "cpc_estimate" ("low"|"medium"|"high")
- "seasonality" ("none"|"mild"|"strong")
- "related_keywords" (string[], max 8)
- "long_tail_variations" (string[], max 5)

No markdown, no extra text.`;
}
