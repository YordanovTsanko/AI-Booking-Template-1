// Groq client over native fetch (Node 18+). Groq exposes an OpenAI-compatible API.
// Never used when GROQ_API_KEY is missing – callers fall back to the mock AI.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Default model (current Groq production model). Override with GROQ_MODEL in .env if Groq retires it.
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
// Tried automatically if the main model is unavailable/decommissioned.
const FALLBACK_MODEL = 'openai/gpt-oss-20b';
const TIMEOUT_MS = 20000;

export const hasGroq = () => Boolean((process.env.GROQ_API_KEY || '').trim());

export const getGroqModel = () => (process.env.GROQ_MODEL || '').trim() || DEFAULT_MODEL;

const isReasoningModel = (model) => model.startsWith('openai/gpt-oss') || model.startsWith('qwen/');

const extractJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Groq returned invalid JSON');
  }
};

const requestGroq = async (model, { messages, json, maxTokens, temperature }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const body = {
      model,
      messages,
      temperature,
      // reasoning models spend tokens on thinking first, so give them more room
      max_completion_tokens: isReasoningModel(model) ? maxTokens + 1024 : maxTokens,
      ...(isReasoningModel(model) ? { reasoning_effort: 'low' } : {}),
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    };

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY.trim()}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      const error = new Error(`Groq HTTP ${response.status}: ${text.slice(0, 300)}`);
      error.status = response.status;
      error.modelProblem = response.status === 404 || /model_(not_found|decommissioned)|does not exist|decommissioned/i.test(text);
      throw error;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Groq returned an empty response');
    return json ? extractJson(content) : content;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Calls Groq Chat Completions. Throws on any failure –
 * callers must catch and fall back to the mock AI.
 * @param {{ messages: Array<{role: string, content: string}>, json?: boolean, maxTokens?: number, temperature?: number }} options
 */
export const callGroq = async ({ messages, json = false, maxTokens = 400, temperature = 0.6 }) => {
  if (!hasGroq()) throw new Error('GROQ_API_KEY is not set');

  const model = getGroqModel();
  try {
    return await requestGroq(model, { messages, json, maxTokens, temperature });
  } catch (err) {
    if (err.modelProblem && model !== FALLBACK_MODEL) {
      console.warn(`⚠️  Groq model "${model}" is unavailable – retrying with "${FALLBACK_MODEL}"`);
      return requestGroq(FALLBACK_MODEL, { messages, json, maxTokens, temperature });
    }
    throw err;
  }
};
