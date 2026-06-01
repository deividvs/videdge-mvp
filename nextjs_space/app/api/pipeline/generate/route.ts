export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getStage1Prompt, getStage2Prompt, getStage3Prompt,
  getStage4Prompt, getStage5Prompt, YouTubeDataContext,
} from '@/lib/pipeline-prompts';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });

    const body = await request.json();
    const { sessionId, stage, extraParams } = body || {};

    if (!sessionId || !stage) {
      return new Response(JSON.stringify({ error: 'sessionId e stage são obrigatórios' }), { status: 400 });
    }

    // Fetch pipeline session
    const ps = await prisma.pipelineSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!ps) return new Response(JSON.stringify({ error: 'Sessão não encontrada' }), { status: 404 });

    // Parse YouTube data if available
    let ytData: YouTubeDataContext | undefined;
    try {
      if (ps.youtubeData) ytData = JSON.parse(ps.youtubeData);
    } catch { /* ignore parse errors */ }

    // Build prompt based on stage
    let promptData: { system: string; user: string };

    switch (stage) {
      case 1:
        promptData = getStage1Prompt(
          ps.niche, ps.country || '', ps.language || '', ps.audience || '',
          ps.channelType || 'faceless', ps.channelGoal || 'AdSense',
          ps.videoDuration || '10 minutos', ps.contentTone || 'curioso', ytData
        );
        break;

      case 2:
        promptData = getStage2Prompt(ps.niche, ps.country || '', ps.language || '', ytData);
        break;

      case 3: {
        const videoTitle = extraParams?.videoTitle || ps.niche;
        const emotion = extraParams?.emotion || 'curiosidade';
        const style = extraParams?.style || 'YouTube viral';
        promptData = getStage3Prompt(
          videoTitle, ps.niche, ps.audience || '', emotion, style, ytData
        );
        break;
      }

      case 4: {
        const title = extraParams?.videoTitle || ps.niche;
        const cta = extraParams?.cta || 'Inscreva-se e ative as notificações';
        promptData = getStage4Prompt(
          title, ps.niche, ps.audience || '', ps.videoDuration || '10 minutos',
          ps.contentTone || 'curioso', ps.channelGoal || 'AdSense',
          (ps.channelType || 'faceless') === 'faceless', cta, ytData
        );
        break;
      }

      case 5: {
        const channelLevel = extraParams?.channelLevel || 'novo';
        const postingFreq = extraParams?.postingFrequency || '3x por semana';
        promptData = getStage5Prompt(
          ps.niche, ps.country || '', ps.language || '', ps.audience || '',
          ps.channelGoal || 'AdSense', ps.channelGoal || 'AdSense',
          postingFreq, channelLevel,
          (ps.channelType || 'faceless') === 'faceless', ytData
        );
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Etapa inválida' }), { status: 400 });
    }

    // Call LLM API
    const llmRes = await fetch('https://api.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [
          { role: 'system', content: promptData.system },
          { role: 'user', content: promptData.user },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.error('LLM error:', errText);
      return new Response(JSON.stringify({ error: 'Erro na geração de IA' }), { status: 500 });
    }

    const llmData = await llmRes.json();
    const content = llmData.choices?.[0]?.message?.content || '{}';

    let result;
    try {
      const cleaned = content.replace(/```json\n?|```\n?/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { rawContent: content };
    }

    // Save result to pipeline session
    const stageField = `stage${stage}Result` as const;
    const updateData: any = {
      [stageField]: JSON.stringify(result),
      currentStage: Math.max(ps.currentStage, stage),
    };

    await prisma.pipelineSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    // Also save to specific models for stage 2, 3, 5
    if (stage === 2 && result.generalDiagnosis) {
      await prisma.patternAnalysis.create({
        data: {
          userId,
          niche: ps.niche,
          query: ps.niche,
          videosAnalyzed: ytData?.videos?.length || 0,
          analysisResult: JSON.stringify(result),
          pipelineSessionId: sessionId,
        },
      });
    }

    if (stage === 3 && result.concepts) {
      for (const c of result.concepts) {
        await prisma.thumbnailConcept.create({
          data: {
            userId,
            videoTitle: extraParams?.videoTitle || ps.niche,
            niche: ps.niche,
            emotion: extraParams?.emotion || null,
            style: extraParams?.style || null,
            conceptName: c.name || 'Conceito',
            visualIdea: c.visualIdea || '',
            thumbnailText: c.thumbnailText || null,
            emotionGenerated: c.emotion || null,
            mainElements: c.mainElements || null,
            composition: c.composition || null,
            suggestedColors: c.suggestedColors || null,
            imageStyle: c.imageStyle || null,
            aiImagePrompt: c.aiImagePrompt || null,
            clickReason: c.clickReason || null,
            riskNote: c.risk || null,
            abTestSuggestion: c.abTestSuggestion || null,
            pipelineSessionId: sessionId,
          },
        });
      }
    }

    if (stage === 5 && result.nicheDiagnosis) {
      await prisma.growthPlan.create({
        data: {
          userId,
          niche: ps.niche,
          channelLevel: extraParams?.channelLevel || 'novo',
          planResult: JSON.stringify(result),
          pipelineSessionId: sessionId,
        },
      });
    }

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Pipeline generate error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), { status: 500 });
  }
}
