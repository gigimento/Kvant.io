export function buildAgenticReadinessSystem(): string {
  return `You are an Agentic Search Optimization specialist. Analyze a website's readiness for AI agent task completion.
Return ONLY a JSON object with keys:
- "overall_score" (0-100)
- "webmcp_status" ("implemented"|"partial"|"missing")
- "task_completion_score" (0-100)
- "friction_points" (array of {page: string, task: string, issue: string, severity: "high"|"medium"|"low", recommendation: string})
- "agent_hostile_patterns" (string[], things like custom widgets, CAPTCHA walls, mandatory accounts)
- "actions_possible" (string[], e.g., ["book consultation", "buy product", "register for trial"])
- "summary" (string, max 200 chars)

No markdown. Return JSON only.`;
}

export function buildAgenticReadinessUser(params: {
  url: string;
  pageTitle: string;
  metaDescription: string;
  hasStructuredData: boolean;
  wordCount: number;
  h1Tags: string[];
  hasCanonical: boolean;
}): string {
  return `URL: ${params.url}
Title: ${params.pageTitle || '(missing)'}
Description: ${params.metaDescription || '(missing)'}
Structured Data: ${params.hasStructuredData ? 'Present' : 'Not detected'}
Word Count: ${params.wordCount}
H1 Tags: ${params.h1Tags.join(', ') || '(none)'}
Has Canonical: ${params.hasCanonical ? 'Yes' : 'No'}

Analyze agentic search readiness. Return JSON only.`;
}
