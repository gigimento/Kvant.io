export function buildPromptGenerationSystem(): string {
  return `You are a search marketing analyst designing an AI citation audit.
Generate 20 diverse search prompts that real buyers would type into AI assistants
like ChatGPT, Claude, Gemini, and Perplexity when researching a brand or service.

Rules:
- Cover 4 categories: recommendation (5), comparison (5), informational (5), specific review (5)
- Use natural language, real queries people actually type
- Include the brand name and competitor names where relevant
- Return ONLY a JSON array of objects with keys: "text", "category"
- No markdown, no extra text`;
}

export function buildPromptGenerationUser(
  brandName: string,
  competitors: string[],
  industry: string,
): string {
  return `Brand: ${brandName}
Competitors: ${competitors.join(', ')}
Industry: ${industry || 'Not specified'}

Generate 20 prompts. Return JSON array like:
[{"text": "What is the best SEO tool for small businesses?", "category": "recommendation"}]`;
}

export function buildCitationAnalysisSystem(): string {
  return `You are analyzing AI assistant responses for brand citations.
Your job is to determine if a specific brand is mentioned in the response,
and which competitors are also mentioned.

Rules:
- Return ONLY a JSON object with keys: "brand_mentioned" (boolean), "competitors_mentioned" (string[]), "snippet" (string, max 200 chars)
- "brand_mentioned" is true if the brand name appears anywhere in the response
- "competitors_mentioned" lists any competitor names found in the response
- "snippet" is the first sentence or phrase where the brand appears (or empty if not mentioned)
- No markdown, no extra text`;
}

export function buildCitationAnalysisUser(
  brandName: string,
  competitors: string[],
  prompt: string,
  response: string,
): string {
  return `Brand to find: ${brandName}
Competitors: ${competitors.join(', ')}
Original prompt: "${prompt}"
AI response: "${response}"

Analyze if "${brandName}" is mentioned. Return JSON only.`;
}

export function buildFixPackSystem(): string {
  return `You are an AI citation strategist. Based on audit results, generate a prioritized fix pack.
Return ONLY a JSON object with keys:
- "overall_citation_rate" (number, 0-100)
- "platform_breakdown" (array of {platform: string, citation_rate: number, gap_vs_competitor: number})
- "top_lost_prompts" (array of {prompt: string, winning_competitors: string[], fix: string}, max 5)
- "recommendations" (array of {priority: "P1"|"P2"|"P3", action: string, expected_impact: string}, max 5)
- "competitor_threat_level" ("low"|"medium"|"high"|"critical")

No markdown, no extra text.`;
}

export function buildFixPackUser(
  brandName: string,
  competitors: string[],
  resultsSummary: string,
): string {
  return `Brand: ${brandName}
Competitors: ${competitors.join(', ')}
Results: ${resultsSummary}

Generate fix pack. Return JSON only.`;
}
