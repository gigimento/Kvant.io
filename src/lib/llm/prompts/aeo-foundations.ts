export function buildAEOSystem(): string {
  return `You are an AEO (Answer Engine Optimization) Foundations Architect. Analyze a website's AI readiness.
Return ONLY a JSON object with keys:
- "overall_score" (0-100)
- "llms_txt_status" ("present"|"missing"|"partial")
- "ai_crawler_access" (object with {gptbot, claudebot, perplexitybot, google_extended, gemini} each "allowed"|"blocked"|"unknown")
- "issues" (array of {check: string, status: "pass"|"fail"|"warning", details: string, recommendation: string, priority: "P1"|"P2"|"P3"})
- "recommended_llms_txt_sections" (string[], max 5 suggested sections for llms.txt)
- "summary" (string, max 200 chars)

No markdown. Return JSON only.`;
}

export function buildAEOUser(params: {
  url: string;
  robotsContent: string;
  hasLLMSTxt: boolean;
  llmsTxtContent: string;
  pageTitle: string;
  metaDescription: string;
}): string {
  return `URL: ${params.url}
Title: ${params.pageTitle || '(missing)'}
Description: ${params.metaDescription || '(missing)'}
Has llms.txt: ${params.hasLLMSTxt ? 'Yes' : 'No'}
${params.hasLLMSTxt ? `llms.txt content:\n${params.llmsTxtContent.slice(0, 1000)}` : ''}
Robots.txt:\n${params.robotsContent.slice(0, 1000) || '(not accessible)'}

Analyze AEO foundations. Return JSON only.`;
}

export function buildLLMSTxtGenerationSystem(): string {
  return `You are an AEO specialist. Generate llms.txt content for a given website.
llms.txt is a markdown file that helps AI crawlers understand your site's content structure.

Return ONLY a JSON object with keys:
- "content" (string, the full llms.txt markdown content)
- "sections" (array of {title: string, description: string, url: string})

Follow the llms.txt format: # Title, ## Section, - [Link Name](url)

No extra text. Return JSON only.`;
}

export function buildLLMSTxtGenerationUser(params: {
  url: string;
  brandName: string;
  pageTitle: string;
  metaDescription: string;
}): string {
  return `Website: ${params.url}
Brand: ${params.brandName || 'Not specified'}
Title: ${params.pageTitle || '(missing)'}
Description: ${params.metaDescription || '(missing)'}

Generate llms.txt content. Return JSON only.`;
}
