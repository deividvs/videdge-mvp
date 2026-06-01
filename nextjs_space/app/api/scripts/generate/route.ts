export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getLLMConfig, callLLMStreaming } from '@/lib/llm-config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
    const userId = (session.user as any)?.id;

    const body = await request.json();
    const videoIdeaId = body?.videoIdeaId;
    if (!videoIdeaId) return new Response(JSON.stringify({ error: 'videoIdeaId é obrigatório' }), { status: 400 });

    const idea = await prisma.videoIdea.findFirst({ where: { id: videoIdeaId, userId } });
    if (!idea) return new Response(JSON.stringify({ error: 'Ideia não encontrada' }), { status: 404 });

    const systemPrompt = `Você é um roteirista especialista em canais faceless do YouTube. Você cria roteiros com hook forte nos primeiros 15 segundos, progressão narrativa que mantém retenção, e CTA final poderoso. Seus roteiros são otimizados para engajamento e algoritmo do YouTube.

Responda EXCLUSIVAMENTE em JSON válido. Sem markdown, sem code blocks.

{
  "title": "Título do vídeo",
  "description": "Descrição estratégica para YouTube",
  "hook": "Hook dos primeiros 15 segundos - texto completo de narração",
  "introduction": "Introdução completa após o hook",
  "sectionOne": "Seção 1 completa com narração",
  "sectionTwo": "Seção 2 completa com narração",
  "sectionThree": "Seção 3 completa com narração",
  "sectionFour": "Seção 4 completa com narração",
  "conclusion": "Conclusão do vídeo",
  "cta": "CTA final poderoso",
  "brollSuggestions": "Sugestões de B-roll para cada seção",
  "visualSuggestions": "Sugestões de imagens e vídeos ilustrativos",
  "musicSuggestions": "Sugestões de trilha sonora e clima",
  "estimatedDuration": "Duração estimada"
}`;

    const userPrompt = `Crie um roteiro completo para o seguinte vídeo:
- Título: ${idea?.title ?? ''}
- Nicho: ${idea?.niche ?? ''}
- Público: ${idea?.audience ?? ''}
- Objetivo: ${idea?.objective ?? ''}
- Duração desejada: ${idea?.duration ?? ''}
- Tom: ${idea?.tone ?? ''}
- Hook base: ${idea?.hook ?? ''}
- Promessa: ${idea?.promise ?? ''}
- Estrutura: ${idea?.summaryStructure ?? ''}

Crie um roteiro detalhado com narração completa para cada seção. Responda APENAS com JSON válido.`;

    const llmConfig = await getLLMConfig(userId);
    const response = await callLLMStreaming(llmConfig, systemPrompt, userPrompt, {
      temperature: 0.7,
      max_tokens: 4000,
      response_format: llmConfig.provider !== 'claude' ? { type: 'json_object' } : undefined,
    });

    if (!response.ok) {
      console.error('LLM API error:', await response.text().catch(() => ''));
      return new Response(JSON.stringify({ error: 'Erro na API de IA' }), { status: 500 });
    }

    const reader = response.body?.getReader();
    if (!reader) return new Response(JSON.stringify({ error: 'Sem resposta' }), { status: 500 });

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
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', result: finalResult })}\n\n`));
                  } catch (e: any) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'error', message: 'Erro ao processar resposta' })}\n\n`));
                  }
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  buffer += parsed?.choices?.[0]?.delta?.content ?? '';
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'processing', message: 'Gerando roteiro...' })}\n\n`));
                } catch (e: any) {}
              }
            }
          }
          if (buffer) {
            try {
              const finalResult = JSON.parse(buffer);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', result: finalResult })}\n\n`));
            } catch (e: any) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'error', message: 'Resposta incompleta' })}\n\n`));
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
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (error: any) {
    console.error('Generate script error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
  }
}
