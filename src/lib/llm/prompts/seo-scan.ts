export function buildBrandScanPrompt(params: {
  brandName: string
  competitors: string[]
  keyword: string
}): string {
  return `You are a search engine and AI assistant simulator. Answer the following question concisely as a helpful AI:

User question: "${params.keyword}"

IMPORTANT: After your answer, you MUST analyze whether you mentioned any of these brands in your answer.
Brands to check: ${params.brandName}${params.competitors.length > 0 ? ", " + params.competitors.join(", ") : ""}

Format your response EXACTLY like this, with nothing before or after:

---ANSWER---
[your answer here]

---ANALYSIS---
Brand: ${params.brandName}
Mentioned: [yes or no]
Sentiment: [positive or negative or neutral]

${params.competitors.map(c => `Brand: ${c}
Mentioned: [yes or no]
Sentiment: [positive or negative or neutral]`).join("\n\n")}`
}

export function buildShareOfVoicePrompt(params: {
  brandName: string
  competitors: string[]
  keyword: string
}): string {
  return `You are a market analyst. When asked "${params.keyword}", which brands would you recommend?

List the brands you'd mention and assign each a percentage representing how likely you are to recommend them. The percentages must add up to 100%.

Brands to consider: ${params.brandName}, ${params.competitors.join(", ")}

Respond in plain text. Do NOT use JSON or markdown.`
}

export function buildTechSEOAnalysisSystem(): string {
  return `You are a senior technical SEO auditor. Analyze the provided website data and return a structured audit.
Return ONLY a JSON object with keys:
- "overall_score" (0-100)
- "issues" (array of {check: string, status: "pass"|"fail"|"warning", details: string, recommendation: string, priority: "P1"|"P2"|"P3"})
- "summary" (string, max 200 chars)

Cover: robots.txt, sitemap, title tag, meta description, headings structure, structured data, page speed indicators, mobile readiness, HTTPS, canonical tags, viewport meta tag.
No markdown, no extra text.`;
}

export function buildTechSEOAnalysisUser(params: {
  url: string;
  pageTitle: string;
  metaDescription: string;
  h1Tags: string[];
  h2Tags: string[];
  hasStructuredData: boolean;
  robotsContent: string;
  sitemapUrls: string[];
  wordCount: number;
  hasViewportMeta: boolean;
  hasCanonical: boolean;
  isHTTPS: boolean;
  internalLinks: number;
  externalLinks: number;
  imagesWithoutAlt: number;
}): string {
  return `URL: ${params.url}
Title: ${params.pageTitle || '(missing)'}
Meta Description: ${params.metaDescription || '(missing)'}
H1 Tags: ${params.h1Tags.join(', ') || '(none)'}
H2 Tags (first 10): ${params.h2Tags.slice(0, 10).join(', ') || '(none)'}
Structured Data: ${params.hasStructuredData ? 'Present' : 'Not detected'}
Word Count: ${params.wordCount}
Viewport Meta: ${params.hasViewportMeta ? 'Present' : 'Missing'}
Canonical Tag: ${params.hasCanonical ? 'Present' : 'Missing'}
HTTPS: ${params.isHTTPS ? 'Yes' : 'No'}
Internal Links: ${params.internalLinks}
External Links: ${params.externalLinks}
Images Missing Alt: ${params.imagesWithoutAlt}

Robots.txt: ${params.robotsContent.slice(0, 500) || '(not accessible)'}
Sitemap URLs (first 10): ${params.sitemapUrls.slice(0, 10).join(', ') || '(not accessible)'}

Analyze technical SEO. Return JSON only.`;
}

export function buildKeywordResearchSystem(): string {
  return `You are an SEO keyword strategist. Generate strategic keyword suggestions based on brand, competitors, and industry.
Return ONLY a JSON array of objects with keys:
- "keyword" (string)
- "intent" ("informational"|"commercial"|"transactional"|"navigational")
- "difficulty" ("easy"|"medium"|"hard")
- "rationale" (string, max 100 chars)

Generate 15-20 keywords. Include long-tail variations. No markdown, no extra text.`;
}

export function buildKeywordResearchUser(params: {
  brandName: string;
  competitors: string[];
  industry: string;
  existingKeywords: string[];
}): string {
  return `Brand: ${params.brandName}
Industry: ${params.industry || 'Not specified'}
Competitors: ${params.competitors.join(', ') || 'None'}
Current keywords tracked: ${params.existingKeywords.join(', ') || 'None'}

Generate SEO keyword suggestions. Return JSON array only.`;
}

export function buildOnPageAnalysisSystem(): string {
  return `You are an on-page SEO analyst. Review the extracted page data and provide optimization recommendations.
Return ONLY a JSON array of objects with keys:
- "element" (string)
- "current" (string)
- "issue" (string)
- "recommendation" (string)
- "priority" ("P1"|"P2"|"P3")

Cover: title length, meta description quality, heading hierarchy, keyword usage, content length, image alt text, internal linking.
No markdown, no extra text.`;
}

export function buildOnPageAnalysisUser(params: {
  url: string;
  title: string;
  metaDescription: string;
  h1Tags: string[];
  h2Tags: string[];
  wordCount: number;
  imagesWithoutAlt: number;
  brandName: string;
  keyword: string;
}): string {
  return `URL: ${params.url}
Target Brand: ${params.brandName}
Target Keyword: ${params.keyword}
Title: "${params.title}"
Meta Description: "${params.metaDescription}"
H1 Tags: ${params.h1Tags.join(', ')}
H2 Tags (first 10): ${params.h2Tags.slice(0, 10).join(', ')}
Word Count: ${params.wordCount}
Images Missing Alt: ${params.imagesWithoutAlt}

Analyze on-page SEO. Return JSON array only.`;
}
