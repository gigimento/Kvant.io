export function buildNarrativePrompt(data: {
  clientName: string
  periodStart: string
  periodEnd: string
  metrics: {
    sessions: number
    users: number
    pageviews: number
    bounceRate: number
    avgSessionDuration: number
    topPages: { path: string; views: number }[]
    sessionsBySource: { source: string; sessions: number }[]
    sessionsChange: number
    usersChange: number
  }
}): string {
  return `You are a senior marketing analyst writing a monthly performance report for a client.

CLIENT: ${data.clientName}
PERIOD: ${data.periodStart} to ${data.periodEnd}

KEY METRICS:
- Sessions: ${data.metrics.sessions} (${data.metrics.sessionsChange >= 0 ? "+" : ""}${data.metrics.sessionsChange}% vs prev period)
- Users: ${data.metrics.users} (${data.metrics.usersChange >= 0 ? "+" : ""}${data.metrics.usersChange}% vs prev period)
- Pageviews: ${data.metrics.pageviews}
- Bounce Rate: ${data.metrics.bounceRate}%
- Avg Session Duration: ${Math.round(data.metrics.avgSessionDuration / 60)}min ${Math.round(data.metrics.avgSessionDuration % 60)}s

TOP PAGES:
${data.metrics.topPages.map(p => `- ${p.path}: ${p.views} views`).join("\n")}

TRAFFIC SOURCES:
${data.metrics.sessionsBySource.map(s => `- ${s.source}: ${s.sessions} sessions`).join("\n")}

Write a professional, human-readable report summary (3-4 paragraphs). Include:
1. Executive summary of performance
2. Key wins and what drove them
3. Areas needing attention
4. Recommendations for next period

Use natural language. Avoid jargon. The tone should be confident and consultative.`
}
