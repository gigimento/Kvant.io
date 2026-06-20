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
