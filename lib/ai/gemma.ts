// Dual-provider AI: Ollama (local) with OpenRouter (cloud) fallback

// --- Ollama config ---
const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

// --- OpenRouter config ---
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free';

// --- Ollama availability cache ---
let ollamaAvailableCache: { value: boolean; timestamp: number } | null = null;
const OLLAMA_CACHE_TTL = 60_000; // 60 seconds

async function isOllamaAvailable(): Promise<boolean> {
  // Return cached result if still fresh
  if (
    ollamaAvailableCache &&
    Date.now() - ollamaAvailableCache.timestamp < OLLAMA_CACHE_TTL
  ) {
    return ollamaAvailableCache.value;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const available = res.ok;
    ollamaAvailableCache = { value: available, timestamp: Date.now() };
    return available;
  } catch {
    ollamaAvailableCache = { value: false, timestamp: Date.now() };
    return false;
  }
}

async function shouldUseOllama(): Promise<boolean> {
  // If OLLAMA_URL is explicitly set, prefer Ollama if reachable
  if (process.env.OLLAMA_URL) {
    return isOllamaAvailable();
  }

  // In development, try Ollama first
  if (process.env.NODE_ENV !== 'production') {
    return isOllamaAvailable();
  }

  // In production without explicit OLLAMA_URL, use OpenRouter
  return false;
}

// --- Shared types ---
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function buildMessages(
  systemPrompt: string,
  messages: { role: 'user' | 'model'; content: string }[]
): ChatMessage[] {
  return [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    })),
  ];
}

// =============================================================================
// callGemma - non-streaming
// =============================================================================

export async function callGemma(
  systemPrompt: string,
  messages: { role: 'user' | 'model'; content: string }[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }
): Promise<string> {
  const useOllama = await shouldUseOllama();

  if (useOllama) {
    return callGemmaOllama(systemPrompt, messages, options);
  }
  return callGemmaOpenRouter(systemPrompt, messages, options);
}

async function callGemmaOllama(
  systemPrompt: string,
  messages: { role: 'user' | 'model'; content: string }[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }
): Promise<string> {
  console.log(`[AI] Using Ollama (local) — model: ${OLLAMA_MODEL}`);

  const ollamaMessages = buildMessages(systemPrompt, messages);

  const body: Record<string, unknown> = {
    model: OLLAMA_MODEL,
    messages: ollamaMessages,
    stream: false,
    options: {
      temperature: options?.temperature ?? 0.7,
      top_p: 0.95,
      num_predict: options?.maxTokens ?? 2048,
    },
  };

  if (options?.jsonMode) {
    body.format = 'json';
  }

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.message?.content || '';
}

async function callGemmaOpenRouter(
  systemPrompt: string,
  messages: { role: 'user' | 'model'; content: string }[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }
): Promise<string> {
  console.log(`[AI] Using OpenRouter (cloud) — model: ${OPENROUTER_MODEL}`);

  if (!OPENROUTER_API_KEY) {
    throw new Error(
      'OpenRouter API key not configured. Set OPENROUTER_API_KEY environment variable.'
    );
  }

  const chatMessages = buildMessages(systemPrompt, messages);

  const body: Record<string, unknown> = {
    model: OPENROUTER_MODEL,
    messages: chatMessages,
    temperature: options?.temperature ?? 0.7,
    top_p: 0.95,
    max_tokens: options?.maxTokens ?? 2048,
  };

  if (options?.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// =============================================================================
// streamGemma - streaming
// =============================================================================

export async function streamGemma(
  systemPrompt: string,
  messages: { role: 'user' | 'model'; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<ReadableStream<Uint8Array>> {
  const useOllama = await shouldUseOllama();

  if (useOllama) {
    return streamGemmaOllama(systemPrompt, messages, options);
  }
  return streamGemmaOpenRouter(systemPrompt, messages, options);
}

async function streamGemmaOllama(
  systemPrompt: string,
  messages: { role: 'user' | 'model'; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<ReadableStream<Uint8Array>> {
  console.log(`[AI] Using Ollama (local) streaming — model: ${OLLAMA_MODEL}`);

  const ollamaMessages = buildMessages(systemPrompt, messages);

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: ollamaMessages,
      stream: true,
      options: {
        temperature: options?.temperature ?? 0.7,
        top_p: 0.95,
        num_predict: options?.maxTokens ?? 4096,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama streaming error (${response.status}): ${errorText}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.trim());

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.done) {
              controller.close();
              return;
            }
            const text = parsed.message?.content;
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

async function streamGemmaOpenRouter(
  systemPrompt: string,
  messages: { role: 'user' | 'model'; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<ReadableStream<Uint8Array>> {
  console.log(`[AI] Using OpenRouter (cloud) streaming — model: ${OPENROUTER_MODEL}`);

  if (!OPENROUTER_API_KEY) {
    throw new Error(
      'OpenRouter API key not configured. Set OPENROUTER_API_KEY environment variable.'
    );
  }

  const chatMessages = buildMessages(systemPrompt, messages);

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: chatMessages,
      stream: true,
      temperature: options?.temperature ?? 0.7,
      top_p: 0.95,
      max_tokens: options?.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter streaming error (${response.status}): ${errorText}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.trim());

        for (const line of lines) {
          // OpenRouter uses SSE format: "data: {json}"
          const dataPrefix = 'data: ';
          if (!line.startsWith(dataPrefix)) continue;

          const jsonStr = line.slice(dataPrefix.length);
          if (jsonStr === '[DONE]') {
            controller.close();
            return;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed.choices?.[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}
