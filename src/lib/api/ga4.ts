export async function getGA4Client(
  accessToken: string,
  propertyId: string
) {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
        ],
        dimensions: [
          { name: "date" },
          { name: "sessionSource" },
          { name: "landingPagePlusQueryString" },
        ],
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`GA4 API error: ${response.statusText}`)
  }

  return response.json()
}

export const GA4_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
].join(" ")
