export type LLMProvider = 'chatgpt' | 'claude' | 'gemini' | 'perplexity';
export type LLMModel = 'fast' | 'quality';

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const GEMINI_MODELS: Record<LLMModel, string> = {
  fast: 'gemini-3.1-flash-lite',
  quality: 'gemini-3.1-flash-001',
};

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delayMs = 2000,
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429 && i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
        continue;
      }
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw new Error('fetchWithRetry: exceeded retries');
}

export async function callOpenAI(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  model = 'gpt-4o-mini',
): Promise<LLMResponse> {
  const start = Date.now();
  const response = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    model: data.model ?? model,
    usage: {
      prompt_tokens: data.usage?.prompt_tokens ?? 0,
      completion_tokens: data.usage?.completion_tokens ?? 0,
      total_tokens: data.usage?.total_tokens ?? 0,
    },
  };
}

export async function callAnthropic(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  model = 'claude-sonnet-4-20250514',
): Promise<LLMResponse> {
  const start = Date.now();
  const response = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = data.content
    ?.map((c: any) => (c.type === 'text' ? c.text : ''))
    .join('\n');

  return {
    content: content ?? '',
    model: data.model ?? model,
    usage: {
      prompt_tokens: data.usage?.input_tokens ?? 0,
      completion_tokens: data.usage?.output_tokens ?? 0,
      total_tokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    },
  };
}

export async function callGemini(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  model = 'gemini-2.0-flash',
): Promise<LLMResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
    model: data.modelVersion ?? model,
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount ?? 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      total_tokens: data.usageMetadata?.totalTokenCount ?? 0,
    },
  };
}

export async function callPerplexity(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  model = 'sonar-pro',
): Promise<LLMResponse> {
  const response = await fetchWithRetry('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Perplexity API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    model: data.model ?? model,
    usage: {
      prompt_tokens: data.usage?.prompt_tokens ?? 0,
      completion_tokens: data.usage?.completion_tokens ?? 0,
      total_tokens: data.usage?.total_tokens ?? 0,
    },
  };
}

export const PROVIDER_NAMES: Record<LLMProvider, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
};

export const PROVIDER_CONFIG_KEY: Record<LLMProvider, string> = {
  chatgpt: 'openai_api_key',
  claude: 'anthropic_api_key',
  gemini: 'google_ai_api_key',
  perplexity: 'perplexity_api_key',
};

async function callGeminiFromEnv(prompt: string, model: string): Promise<LLMResponse> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
    }),
  });

  const data = await response.json();
  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
    model: data.modelVersion ?? model,
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount ?? 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      total_tokens: data.usageMetadata?.totalTokenCount ?? 0,
    },
  };
}

export async function askLLM(prompt: string, model: LLMModel = 'fast'): Promise<LLMResponse> {
  return callGeminiFromEnv(prompt, GEMINI_MODELS[model]);
}

export async function askLLMWithSystem(
  systemPrompt: string,
  userPrompt: string,
  model: LLMModel = 'fast',
): Promise<LLMResponse> {
  return callGeminiFromEnv(`${systemPrompt}\n\n${userPrompt}`, GEMINI_MODELS[model]);
}

export async function callProvider(
  provider: LLMProvider,
  prompt: string,
  systemPrompt: string,
  apiKey: string,
): Promise<LLMResponse> {
  switch (provider) {
    case 'chatgpt':
      return callOpenAI(prompt, systemPrompt, apiKey);
    case 'claude':
      return callAnthropic(prompt, systemPrompt, apiKey);
    case 'gemini':
      return callGemini(prompt, systemPrompt, apiKey);
    case 'perplexity':
      return callPerplexity(prompt, systemPrompt, apiKey);
  }
}
