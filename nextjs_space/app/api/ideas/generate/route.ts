export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLLMConfig, callLLMStreaming } from '@/lib/llm-config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
    }

    const body = await request.json();
    const { niche, audience, objective, duration, tone } = body ?? {};

    if (!niche || !audience || !objective || !duration || !tone) {
      return new Response(JSON.stringify({ error: 'Todos os campos são obrigatórios' }), { status: 400 });
    }

    const systemPrompt = `Você é um estrategista de conteúdo YouTube especialista em retenção, curiosidade e potencial viral. Você conhece profundamente o algoritmo do YouTube, técnicas de storytelling e psicologia de engajamento. Seu objetivo é gerar ideias de vídeos para canais faceless que sejam altamente acionáveis e com alto potencial de viralização.

Responda EXCLUSIVAMENTE em JSON válido. Sem markdown, sem code blocks, sem texto extra.

Estrutura exata:
{
  "ideas": [
    {
      "title": "Título principal do vídeo",
      "alternativeTitle": "Título alternativo",
      "hook": "Hook inicial que prende a atenção nos primeiros 5 segundos",
      "promise": "Promessa do vídeo para o espectador",
      "summaryStructure": "Estrutura resumida do vídeo em 3-4 linhas",
      "viralPotential": 8,
      "productionDifficulty": 5,
      "strategicReason": "Motivo estratégico pelo qual esta ideia pode funcionar"
    }
  ]
}

Gere exatamente 10 ideias. viralPotential e productionDifficulty são inteiros de 0 a 10.`;

    const userPrompt = `Gere 10 ideias de vídeos com base nos seguintes parâmetros:
- Nicho: ${niche}
- Público-alvo: ${audience}
- Objetivo: ${objective}
- Duração desejada: ${duration}
- Tom: ${tone}

Lembre-se: responda APENAS com JSON válido, sem code blocks ou markdown.`;

    const userId = (session.user as any)?.id;
    const llmConfig = await getLLMConfig(userId);
    const response = await callLLMStreaming(llmConfig, systemPrompt, userPrompt, {
      temperature: 0.8,
      max_tokens: 4000,
      response_format: llmConfig.provider !== 'claude' ? { type: 'json_object' } : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('LLM API error:', errorText);
      return new Response(JSON.stringify({ error: 'Erro na API de IA' }), { status: 500 });
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return new Response(JSON.stringify({ error: 'Sem resposta do servidor' }), { status: 500 });
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        let partialRead = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            partialRead += decoder.decode(value, { stream: true });
            let lines = partialRead.split('\n');
            partialRead = lines.pop() ?? '';
            for (const line of lines) {
              if (line?.startsWith?.('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  try {
                    const finalResult = JSON.parse(buffer);
                    const finalData = JSON.stringify({ status: 'completed', result: finalResult });
                    controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                  } catch (parseErr: any) {
                    console.error('JSON parse error:', parseErr);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'error', message: 'Erro ao processar resposta da IA' })}\n\n`));
                  }
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  buffer += parsed?.choices?.[0]?.delta?.content ?? '';
                  const progressData = JSON.stringify({ status: 'processing', message: 'Gerando ideias...' });
                  controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
                } catch (e: any) {
                  // Skip
                }
              }
            }
          }
          // If we get here without [DONE], try to parse buffer
          if (buffer) {
            try {
              const finalResult = JSON.parse(buffer);
              const finalData = JSON.stringify({ status: 'completed', result: finalResult });
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
            } catch (e: any) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'error', message: 'Resposta incompleta da IA' })}\n\n`));
            }
          }
        } catch (error: any) {
          console.error('Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'error', message: 'Erro no streaming' })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Generate ideas error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), { status: 500 });
  }
}
