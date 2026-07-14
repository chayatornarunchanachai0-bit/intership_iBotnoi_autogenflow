export interface ProviderInfo {
  id: string;
  label: string;
  defaultModel: string;
  keyPlaceholder: string;
  helpText: string;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'groq',
    label: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    keyPlaceholder: 'gsk_...',
    helpText: 'รับ API Key ได้ที่ console.groq.com/keys',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    keyPlaceholder: 'sk-...',
    helpText: 'รับ API Key ได้ที่ platform.openai.com/api-keys',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    defaultModel: 'gemini-3.5-flash',
    keyPlaceholder: 'AIza...',
    helpText: 'รับ API Key ได้ที่ aistudio.google.com/app/apikey',
  },
];

export function getProviderInfo(providerId: string): ProviderInfo {
  return PROVIDERS.find((p) => p.id === providerId) || PROVIDERS[0];
}

const REQUEST_TIMEOUT_MS = 60000;

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`เรียก AI ไม่สำเร็จ: ใช้เวลานานเกินไป (เกิน ${REQUEST_TIMEOUT_MS / 1000} วินาที)`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

const DEFAULT_MAX_TOKENS = 8000;

interface CallProviderParams {
  provider: string;
  apiKey: string;
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export async function callProvider({ provider, apiKey, model, systemPrompt, userPrompt, maxTokens }: CallProviderParams): Promise<string> {
  const info = getProviderInfo(provider);
  const resolvedModel = model?.trim().toLowerCase().replace(/\s+/g, '-') || info.defaultModel;
  const resolvedMaxTokens = maxTokens ?? DEFAULT_MAX_TOKENS;

  switch (provider) {
    case 'groq':
      return callOpenAICompatible({
        url: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey,
        model: resolvedModel,
        systemPrompt,
        userPrompt,
        maxTokens: resolvedMaxTokens,
      });
    case 'openai':
      return callOpenAICompatible({
        url: 'https://api.openai.com/v1/chat/completions',
        apiKey,
        model: resolvedModel,
        systemPrompt,
        userPrompt,
        maxTokens: resolvedMaxTokens,
      });
    case 'gemini':
      return callGemini({ apiKey, model: resolvedModel, systemPrompt, userPrompt, maxTokens: resolvedMaxTokens });
    default:
      throw new Error(`ไม่รู้จัก AI Provider: ${provider}`);
  }
}

interface OpenAICompatibleParams {
  url: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
}

// รอได้สูงสุดต่อครั้งเมื่อโดน rate limit (429) ก่อน retry
const MAX_RETRY_WAIT_MS = 30000;
const MAX_RATE_LIMIT_RETRIES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callOpenAICompatible({ url, apiKey, model, systemPrompt, userPrompt, maxTokens }: OpenAICompatibleParams): Promise<string> {
  let res: Response;
  for (let attempt = 0; ; attempt++) {
    res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: maxTokens,
      }),
    });

    if (res.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
      const retryAfterSec = Number(res.headers.get('retry-after')) || 10;
      await sleep(Math.min(retryAfterSec * 1000 + 500, MAX_RETRY_WAIT_MS));
      continue;
    }
    break;
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`เรียก API ไม่สำเร็จ (${res.status}): ${errBody.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI ไม่ตอบกลับเนื้อหา');
  return content;
}

interface GeminiParams {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
}

async function callGemini({ apiKey, model, systemPrompt, userPrompt, maxTokens }: GeminiParams): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: maxTokens },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`เรียก API ไม่สำเร็จ (${res.status}): ${errBody.slice(0, 300)}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const content = parts?.map((p: { text: string }) => p.text).join('');
  if (!content) throw new Error('AI ไม่ตอบกลับเนื้อหา');
  return content;
}
