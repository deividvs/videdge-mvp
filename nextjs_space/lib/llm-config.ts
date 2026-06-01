import { prisma } from '@/lib/prisma';

export interface LLMConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  provider: string;
}

export async function getLLMConfig(userId: string): Promise<LLMConfig> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { apiProvider: true, apiKey: true },
  });

  const provider = user?.apiProvider || 'abacus';
  const customKey = user?.apiKey;

  switch (provider) {
    case 'openai':
      if (!customKey) throw new Error('Chave da API OpenAI não configurada. Vá em Settings para adicionar.');
      return {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: customKey,
        model: 'gpt-4o-mini',
        provider: 'openai',
      };
    case 'claude':
      if (!customKey) throw new Error('Chave da API Claude não configurada. Vá em Settings para adicionar.');
      return {
        endpoint: 'https://api.anthropic.com/v1/messages',
        apiKey: customKey,
        model: 'claude-sonnet-4-20250514',
        provider: 'claude',
      };
    default:
      return {
        endpoint: 'https://apps.abacus.ai/v1/chat/completions',
        apiKey: process.env.ABACUSAI_API_KEY || '',
        model: 'gpt-5.4-mini',
        provider: 'abacus',
      };
  }
}

export async function callLLM(
  config: LLMConfig,
  systemPrompt: string,
  userPrompt: string,
  options: { temperature?: number; max_tokens?: number; stream?: boolean; response_format?: any } = {}
): Promise<Response> {
  const { temperature = 0.7, max_tokens = 3000, stream = false, response_format } = options;

  if (config.provider === 'claude') {
    // Anthropic Messages API format
    const body: any = {
      model: config.model,
      max_tokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      stream,
    };
    if (temperature !== undefined) body.temperature = temperature;

    return fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
  }

  // OpenAI-compatible format (works for OpenAI and Abacus)
  const body: any = {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens,
    stream,
  };
  if (response_format) body.response_format = response_format;

  return fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });
}

export function extractContent(config: LLMConfig, data: any): string {
  if (config.provider === 'claude') {
    return data.content?.[0]?.text || '';
  }
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Call LLM with streaming enabled. For Claude, converts response to OpenAI-compatible SSE format.
 */
export async function callLLMStreaming(
  config: LLMConfig,
  systemPrompt: string,
  userPrompt: string,
  options: { temperature?: number; max_tokens?: number; response_format?: any } = {}
): Promise<Response> {
  const { temperature = 0.7, max_tokens = 4000, response_format } = options;

  if (config.provider === 'claude') {
    const body: any = {
      model: config.model,
      max_tokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      stream: true,
    };
    if (temperature !== undefined) body.temperature = temperature;

    const claudeRes = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!claudeRes.ok) return claudeRes;

    // Transform Claude SSE → OpenAI-compatible SSE
    const reader = claudeRes.body?.getReader();
    if (!reader) return claudeRes;
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const transformedStream = new ReadableStream({
      async start(controller) {
        let partialRead = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            partialRead += decoder.decode(value, { stream: true });
            let lines = partialRead.split('\n');
            partialRead = lines.pop() ?? '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    // Convert to OpenAI format
                    const chunk = JSON.stringify({
                      choices: [{ delta: { content: parsed.delta.text } }]
                    });
                    controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
                  } else if (parsed.type === 'message_stop') {
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  }
                } catch {}
              }
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(transformedStream, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  // OpenAI-compatible (OpenAI + Abacus)
  const body: any = {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens,
    stream: true,
  };
  if (response_format) body.response_format = response_format;

  return fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });
}
