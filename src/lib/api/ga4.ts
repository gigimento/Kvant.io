const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

export const GA4_SCOPES = "https://www.googleapis.com/auth/analytics.readonly"

export type GA4Metrics = {
  sessions: number
  users: number
  pageviews: number
  bounceRate: number
  avgSessionDuration: number
  sessionsChange: number
  usersChange: number
  topPages: { path: string; views: number }[]
  sessionsBySource: { source: string; sessions: number }[]
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
}> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Token refresh failed: ${res.status} ${body}`)
  }

  return res.json()
}

async function runGa4Report(
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string
) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
        ],
        dimensions: [
          { name: "sessionSource" },
          { name: "landingPagePlusQueryString" },
        ],
        limit: 10000,
      }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GA4 API error: ${res.status} ${body}`)
  }

  return res.json()
}

function parseDimensionValue(rows: any[], dimensionIndex: number, metricIndex: number) {
  const map = new Map<string, number>()
  for (const row of rows) {
    const key = row.dimensionValues?.[dimensionIndex]?.value || "(none)"
    const value = parseFloat(row.metricValues?.[metricIndex]?.value || "0")
    map.set(key, (map.get(key) || 0) + value)
  }
  return map
}

function sortByValue(map: Map<string, number>, limit = 5) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, value]) => ({ key, value: Math.round(value) }))
}

export async function fetchGA4Metrics(
  accessToken: string,
  refreshToken: string,
  propertyId: string,
  expiresAt: string,
  periodStart: string,
  periodEnd: string,
  prevPeriodStart: string,
  prevPeriodEnd: string
): Promise<GA4Metrics> {
  let token = accessToken
  if (new Date(expiresAt) < new Date()) {
    const refreshed = await refreshAccessToken(refreshToken)
    token = refreshed.access_token
  }

  const [currentData, prevData] = await Promise.all([
    runGa4Report(token, propertyId, periodStart, periodEnd),
    runGa4Report(token, propertyId, prevPeriodStart, prevPeriodEnd),
  ])

  const currentRows = currentData.rows || []
  const prevRows = prevData.rows || []

  const extractMetric = (rows: any[], index: number) => {
    if (rows.length === 0) return 0
    return parseFloat(rows[0]?.metricValues?.[index]?.value || "0")
  }

  const currentSessions = extractMetric(currentRows, 0)
  const prevSessions = extractMetric(prevRows, 0)
  const currentUsers = extractMetric(currentRows, 1)
  const prevUsers = extractMetric(prevRows, 1)

  const sessionsChange = prevSessions > 0
    ? ((currentSessions - prevSessions) / prevSessions) * 100
    : 0
  const usersChange = prevUsers > 0
    ? ((currentUsers - prevUsers) / prevUsers) * 100
    : 0

  const bySource = parseDimensionValue(currentRows, 0, 0)
  const byPage = parseDimensionValue(currentRows, 1, 2)

  return {
    sessions: Math.round(currentSessions),
    users: Math.round(currentUsers),
    pageviews: Math.round(extractMetric(currentRows, 2)),
    bounceRate: Math.round(extractMetric(currentRows, 3) * 10) / 10,
    avgSessionDuration: Math.round(extractMetric(currentRows, 4)),
    sessionsChange: Math.round(sessionsChange * 10) / 10,
    usersChange: Math.round(usersChange * 10) / 10,
    topPages: sortByValue(byPage, 5).map((p) => ({ path: p.key, views: p.value })),
    sessionsBySource: sortByValue(bySource, 5).map((s) => ({ source: s.key, sessions: s.value })),
  }
}
