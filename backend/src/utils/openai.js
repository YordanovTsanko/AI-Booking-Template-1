// Thin OpenAI client over native fetch (Node 18+). Never used when the key is missing.

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';
const TIMEOUT_MS = 15000;

export const hasOpenAI = () => Boolean((process.env.OPENAI_API_KEY || '').trim());

/**
 * Calls the Chat Completions API. Throws on any failure –
 * callers must catch and fall back to the mock AI.
 */
export const callOpenAI = async ({ messages, json = false, maxTokens = 400, temperature = 0.6 }) => {
  if (!hasOpenAI()) throw new Error('OPENAI_API_KEY is not set');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY.trim()}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`OpenAI HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('OpenAI returned an empty response');
    return json ? JSON.parse(content) : content;
  } finally {
    clearTimeout(timer);
  }
};
