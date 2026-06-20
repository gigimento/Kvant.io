const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

export type LLMModel = "claude" | "groq"

const MODEL_MAP: Record<LLMModel, string> = {
  claude: "meta-llama/llama-3.3-70b-instruct:free",
  groq: "meta-llama/llama-3.3-70b-instruct:free",
}

interface LLMResponse {
  content: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function askLLM(
  prompt: string,
  model: LLMModel = "groq"
): Promise<LLMResponse> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Agency Tools",
    },
    body: JSON.stringify({
      model: MODEL_MAP[model],
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LLM API error: ${response.status} ${error}`)
  }

  const data = await response.json()

  return {
    content: data.choices?.[0]?.message?.content ?? "",
    model: data.model,
    usage: data.usage,
  }
}

export async function askLLMWithSystem(
  systemPrompt: string,
  userPrompt: string,
  model: LLMModel = "groq"
): Promise<LLMResponse> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Agency Tools",
    },
    body: JSON.stringify({
      model: MODEL_MAP[model],
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LLM API error: ${response.status} ${error}`)
  }

  const data = await response.json()

  return {
    content: data.choices?.[0]?.message?.content ?? "",
    model: data.model,
    usage: data.usage,
  }
}
