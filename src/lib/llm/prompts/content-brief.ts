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
