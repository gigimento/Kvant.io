interface SerperResult {
  title: string
  link: string
  position: number
  snippet?: string
}

interface SerperResponse {
  searchParameters: { q: string }
  organic: SerperResult[]
  knowledgeGraph?: any
  answerBox?: any
  topStories?: any[]
  peopleAlsoAsk?: any[]
  relatedSearches?: string[]
  searchInformation?: {
    totalResults: string
    searchTime: number
  }
}

const SERPER_BASE = "https://google.serper.dev"

export async function searchKeyword(keyword: string): Promise<{
  results: SerperResult[]
  totalResults: string
  serpFeatures: string[]
}> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    return { results: [], totalResults: "0", serpFeatures: [] }
  }

  const res = await fetch(`${SERPER_BASE}/search`, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: keyword, num: 20 }),
  })

  if (!res.ok) {
    throw new Error(`Serper.dev error: ${res.status} ${await res.text()}`)
  }

  const data: SerperResponse = await res.json()

  const features: string[] = []
  if (data.answerBox) features.push("answer_box")
  if (data.knowledgeGraph) features.push("knowledge_graph")
  if (data.topStories?.length) features.push("top_stories")
  if (data.peopleAlsoAsk?.length) features.push("people_also_ask")
  if (data.relatedSearches?.length) features.push("related_searches")

  return {
    results: (data.organic || []).map((r, i) => ({ ...r, position: i + 1 })),
    totalResults: data.searchInformation?.totalResults || "0",
    serpFeatures: features,
  }
}

export function findPosition(results: SerperResult[], targetUrl: string): number | null {
  const normalized = targetUrl.toLowerCase().replace(/\/+$/, "")
  for (const r of results) {
    if (r.link.toLowerCase().replace(/\/+$/, "") === normalized) {
      return r.position
    }
  }
  return null
}
