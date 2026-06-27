import { describe, it, expect, vi, beforeEach } from "vitest"

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
})

describe("LLM providers", () => {
  it("PROVIDER_NAMES has all 4 providers", async () => {
    const { PROVIDER_NAMES } = await import("../llm/providers")
    expect(Object.keys(PROVIDER_NAMES)).toEqual(["chatgpt", "claude", "gemini", "perplexity"])
    expect(PROVIDER_NAMES.chatgpt).toBe("ChatGPT")
    expect(PROVIDER_NAMES.claude).toBe("Claude")
    expect(PROVIDER_NAMES.gemini).toBe("Gemini")
    expect(PROVIDER_NAMES.perplexity).toBe("Perplexity")
  })

  it("PROVIDER_CONFIG_KEY maps providers to config keys", async () => {
    const { PROVIDER_CONFIG_KEY } = await import("../llm/providers")
    expect(PROVIDER_CONFIG_KEY.chatgpt).toBe("openai_api_key")
    expect(PROVIDER_CONFIG_KEY.claude).toBe("anthropic_api_key")
    expect(PROVIDER_CONFIG_KEY.gemini).toBe("google_ai_api_key")
    expect(PROVIDER_CONFIG_KEY.perplexity).toBe("perplexity_api_key")
  })

  it("callGemini formats request correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "Hello from Gemini" }] } }],
        modelVersion: "gemini-2.0-flash",
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20, totalTokenCount: 30 },
      }),
    })

    const { callGemini } = await import("../llm/providers")
    const result = await callGemini("test prompt", "system instruction", "fake-key", "gemini-2.0-flash")

    expect(result.content).toBe("Hello from Gemini")
    expect(result.model).toBe("gemini-2.0-flash")

    const callUrl = mockFetch.mock.calls[0][0]
    expect(callUrl).toContain("generativelanguage.googleapis.com")
    expect(callUrl).toContain("fake-key")
  })

  it("callOpenAI formats request correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Hello from OpenAI" } }],
        model: "gpt-4o-mini",
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      }),
    })

    const { callOpenAI } = await import("../llm/providers")
    const result = await callOpenAI("test prompt", "system instruction", "fake-key", "gpt-4o-mini")

    expect(result.content).toBe("Hello from OpenAI")
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer fake-key")
  })

  it("callAnthropic formats request correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: "Hello from Claude" }],
        model: "claude-sonnet-4-20250514",
        usage: { input_tokens: 10, output_tokens: 20 },
      }),
    })

    const { callAnthropic } = await import("../llm/providers")
    const result = await callAnthropic("test prompt", "system instruction", "fake-key", "claude-sonnet-4-20250514")

    expect(result.content).toBe("Hello from Claude")
    expect(mockFetch.mock.calls[0][1].headers["x-api-key"]).toBe("fake-key")
    expect(mockFetch.mock.calls[0][1].headers["anthropic-version"]).toBe("2023-06-01")
  })

  it("callPerplexity formats request correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Hello from Perplexity" } }],
        model: "sonar-pro",
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      }),
    })

    const { callPerplexity } = await import("../llm/providers")
    const result = await callPerplexity("test prompt", "system instruction", "fake-key", "sonar-pro")

    expect(result.content).toBe("Hello from Perplexity")
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer fake-key")
  })

  it("providers throw on HTTP error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    })

    const { callOpenAI } = await import("../llm/providers")
    await expect(callOpenAI("test", "", "bad-key")).rejects.toThrow("OpenAI API error: 401")
  })

  it("callProvider dispatches to correct provider", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "ok" } }],
        model: "gpt-4o-mini",
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      }),
    })

    const { callProvider } = await import("../llm/providers")
    const result = await callProvider("chatgpt", "hi", "sys", "key")
    expect(result.content).toBe("ok")
  })
})
