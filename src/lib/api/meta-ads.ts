export async function getMetaAdsClient(
  accessToken: string,
  adAccountId: string
) {
  const cleanId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${cleanId}/campaigns`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method: "GET",
    }
  )

  if (!response.ok) {
    throw new Error(`Meta Ads API error: ${response.statusText}`)
  }

  return response.json()
}

export async function getMetaAdsInsights(
  accessToken: string,
  adAccountId: string
) {
  const cleanId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${cleanId}/insights?fields=impressions,clicks,spend,reach,ctr,cpc&date_preset=last_30d`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Meta Ads insights error: ${response.statusText}`)
  }

  return response.json()
}
