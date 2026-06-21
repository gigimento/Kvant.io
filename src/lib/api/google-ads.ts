export async function getGoogleAdsClient(
  accessToken: string,
  customerId: string
) {
  const response = await fetch(
    `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
      },
      body: JSON.stringify({
        query: `
          SELECT
            campaign.id,
            campaign.name,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions
          FROM campaign
          WHERE segments.date DURING LAST_30_DAYS
        `,
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Google Ads API error: ${response.statusText}`)
  }

  return response.json()
}

export const GOOGLE_ADS_SCOPES = [
  "https://www.googleapis.com/auth/adwords",
].join(" ")
