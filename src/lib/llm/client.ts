export type LLMModel = "fast" | "quality"

const MODEL_MAP: Record<LLMModel, string> = {
  fast: "gemini-3.1-flash-lite",
  quality: "gemini-3.1-flash-lite",
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

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 2000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      if (attempt === maxRetries) throw err
      const status = err?.message?.includes("429") ? 429 : 0
      if (status !== 429) throw err
      const delay = baseDelay * Math.pow(2, attempt)
      console.warn(`LLM 429 rate limited — retry ${attempt + 1}/${maxRetries} after ${delay}ms`)
      await sleep(delay)
    }
  }
  throw new Error("callWithRetry: exhausted retries")
}

async function callGemini(prompt: string, model: string): Promise<LLMResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${response.status} ${error}`)
  }

  const data = await response.json()

  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
    model: data.modelVersion ?? model,
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount ?? 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      total_tokens: data.usageMetadata?.totalTokenCount ?? 0,
    },
  }
}

export async function askLLM(
  prompt: string,
  model: LLMModel = "fast"
): Promise<LLMResponse> {
  return callWithRetry(() => callGemini(prompt, MODEL_MAP[model]))
}

export async function askLLMWithSystem(
  systemPrompt: string,
  userPrompt: string,
  model: LLMModel = "fast"
): Promise<LLMResponse> {
  return callWithRetry(() => askLLMWithSystemInner(systemPrompt, userPrompt, model))
}

async function askLLMWithSystemInner(
  systemPrompt: string,
  userPrompt: string,
  model: LLMModel = "fast"
): Promise<LLMResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_MAP[model]}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${response.status} ${error}`)
  }

  const data = await response.json()

  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
    model: data.modelVersion ?? MODEL_MAP[model],
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount ?? 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      total_tokens: data.usageMetadata?.totalTokenCount ?? 0,
    },
  }
}

export type { LLMProvider } from './providers';
export { callProvider, PROVIDER_CONFIG_KEY } from './providers';
