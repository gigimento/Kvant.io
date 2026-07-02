export const GEO_BRIEFS_PROMPT = `You are an AI Visibility expert for marketing agencies.

Analyze the following brand data and generate actionable GEO (Generative Engine Optimization) briefs.

Brand: {brand_name}
Domain: {domain}
Current AI Visibility Score: {score}/100
Competitors: {competitors}
AI Model Mentions: {mentions}

Generate 5-7 specific, actionable recommendations to improve AI visibility.
For each recommendation:
1. State the problem clearly
2. Explain why it matters for AI visibility
3. Provide a specific fix (what to change on the website)
4. Estimate impact (high/medium/low)

Format as JSON array with fields: problem, explanation, fix, impact
`
