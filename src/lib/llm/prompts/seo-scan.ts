export function buildBrandScanPrompt(params: {
  brandName: string
  competitors: string[]
  keyword: string
}): string {
  return `You are analyzing how brands are mentioned in AI responses. Answer the following question:

"${params.keyword}"

After answering, analyze the following brands and tell me:
1. Is "${params.brandName}" mentioned? If yes, in what context and with what sentiment (positive/negative/neutral)?
2. Are any of these competitors mentioned: ${params.competitors.join(", ")}? For each, note sentiment.

Format your response exactly like this:
---ANSWER---
[Your short answer to the question]
---ANALYSIS---
Brand: ${params.brandName}
Mentioned: [yes/no]
Sentiment: [positive/negative/neutral/mixed]
Context: [brief context]

${params.competitors.map(c => `Brand: ${c}
Mentioned: [yes/no]
Sentiment: [positive/negative/neutral/mixed]
Context: [brief context]`).join("\n\n")}`
}

export function buildShareOfVoicePrompt(params: {
  brandName: string
  competitors: string[]
  keyword: string
}): string {
  return `You are a market analyst. When asked "${params.keyword}", which brands would you recommend?

List the brands you'd mention and assign each a percentage representing how likely you are to recommend them. The percentages must add up to 100%.

Brands to consider: ${params.brandName}, ${params.competitors.join(", ")}

Format your response as JSON:
{"brands": [{"name": "...", "share": number, "reason": "..."}]}`
}
