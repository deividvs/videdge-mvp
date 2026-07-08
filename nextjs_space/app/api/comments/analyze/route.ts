export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getLLMConfig, callLLM, extractContent } from '@/lib/llm-config';
import { formatCommentsForPrompt, type YouTubeCommentData } from '@/lib/youtube-comments';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });

    const body = await request.json();
    const { videoId, videoTitle, channelTitle, niche, viewCount, subscriberCount, viralScore } = body || {};

    if (!videoId) {
      return new Response(JSON.stringify({ error: 'videoId é obrigatório' }), { status: 400 });
    }

    // Get useful comments from DB
    const comments = await prisma.youTubeComment.findMany({
      where: { userId, youtubeVideoId: videoId, isUseful: true },
      orderBy: { likeCount: 'desc' },
      take: 300,
    });

    if (comments.length < 5) {
      return new Response(JSON.stringify({
        error: 'Poucos comentários disponíveis para análise. Colete comentários primeiro.',
      }), { status: 400 });
    }

    const commentData: YouTubeCommentData[] = comments.map(c => ({
      commentId: c.youtubeCommentId,
      authorDisplayName: 'Anônimo',
      text: c.text,
      likeCount: c.likeCount,
      publishedAt: c.publishedAt?.toISOString() || '',
      updatedAt: c.updatedAt?.toISOString() || '',
      isReply: c.isReply,
      parentCommentId: c.parentCommentId,
      totalReplyCount: 0,
    }));

    const formattedComments = formatCommentsForPrompt(commentData, 150);

    const systemPrompt = `Você é um estrategista sênior de pesquisa de mercado, copywriting de resposta direta e criação de infoprodutos.

Sua tarefa é analisar comentários públicos de um vídeo do YouTube para identificar oportunidades comerciais reais.

Analise os comentários como se fossem uma pesquisa etnográfica.

Regras:
- Não inventar dores que não aparecem nos comentários.
- Não usar dados pessoais dos comentaristas.
- Não prometer faturamento garantido.
- Não sugerir produtos ilegais, enganosos ou prejudiciais.
- Não copiar o produto de outro criador.
- Priorizar produtos simples de validar.
- Priorizar produtos com venda possível por conteúdo orgânico.
- Indicar o nível de confiança da análise.
- Se houver poucos comentários úteis, informar que a confiança é baixa.

Separe claramente:
- [OBSERVADO]: Observações baseadas nos comentários
- [INFERÊNCIA]: Inferências estratégicas
- [RECOMENDAÇÃO]: Recomendações práticas

Responda EXCLUSIVAMENTE em JSON válido, sem markdown ou code blocks.

Estrutura exata:
{
  "summary": {
    "totalAnalyzed": number,
    "usefulComments": number,
    "mainThemes": ["tema1", "tema2", ...],
    "confidenceLevel": "alta|média|baixa",
    "confidenceReason": "motivo"
  },
  "pains": [
    {
      "pain": "descrição da dor",
      "frequency": "alta|média|baixa",
      "emotionalIntensity": "alta|média|baixa",
      "realPhrases": ["frase real 1", "frase real 2"],
      "productPossibility": "como transformar em produto",
      "type": "OBSERVADO|INFERÊNCIA"
    }
  ],
  "desires": [
    {
      "desire": "descrição",
      "howItAppears": "como aparece nos comentários",
      "whatTheyWant": "o que querem alcançar",
      "suggestedProduct": "produto que atenderia",
      "type": "OBSERVADO|INFERÊNCIA"
    }
  ],
  "recurringQuestions": [
    {
      "question": "pergunta",
      "approximateCount": number,
      "answerType": "tipo de resposta buscada",
      "suggestedProduct": "produto recomendado"
    }
  ],
  "objections": ["objeção 1", "objeção 2"],
  "fears": ["medo 1", "medo 2"],
  "limitingBeliefs": ["crença 1", "crença 2"],
  "audienceLanguage": {
    "commonPhrases": ["frase 1", "frase 2", ...],
    "frequentWords": ["palavra 1", "palavra 2", ...],
    "emotionalThemes": ["tema 1", "tema 2", ...]
  },
  "marketInsights": {
    "awarenessLevel": "inconsciente|consciente do problema|consciente da solução|consciente do produto",
    "marketMaturity": "nascente|crescimento|maduro|saturado",
    "purchaseIntent": "baixa|média|alta",
    "monetizationOpportunities": ["oportunidade 1", "oportunidade 2"]
  },
  "infoproductIdeas": [
    {
      "name": "Nome provisório do produto",
      "productType": "ebook|mini curso|curso completo|mentoria|comunidade paga|template|planilha|checklist|desafio 7 dias|workshop|assinatura|consultoria|software simples|pack de prompts|guia prático|treinamento",
      "targetAudience": "público-alvo",
      "mainPain": "dor principal",
      "mainDesire": "desejo principal",
      "promise": "promessa central",
      "uniqueMechanism": "mecanismo único",
      "suggestedModules": ["módulo 1", "módulo 2"],
      "recommendedFormat": "formato",
      "suggestedTicket": "R$ XX - R$ YY",
      "opportunityScore": number,
      "scoreReason": "motivo da pontuação",
      "productionEase": number,
      "salesPotential": number,
      "marketRisk": "risco",
      "expectedObjections": ["objeção 1"],
      "leadMagnetIdea": "ideia de lead magnet",
      "validationOffer": "como validar antes de criar",
      "youtubeSalesStrategy": "como vender pelo YouTube",
      "salesChannel": "melhor canal de venda",
      "bonuses": ["bônus 1"],
      "vslIdea": "ideia de VSL",
      "salesPageIdea": "ideia de página de vendas"
    }
  ]
}`;

    const userPrompt = `Analise os comentários públicos deste vídeo do YouTube:

Título: "${videoTitle || 'N/A'}"
Canal: ${channelTitle || 'N/A'}
Views: ${viewCount?.toLocaleString() || 'N/A'}
Inscritos: ${subscriberCount?.toLocaleString() || 'N/A'}
Viral Score: ${viralScore || 'N/A'}/100
Nicho: ${niche || 'Não especificado'}

Total de comentários úteis: ${comments.length}

=== COMENTÁRIOS PÚBLICOS ===
${formattedComments}
=== FIM DOS COMENTÁRIOS ===

Gere pelo menos 5 ideias de infoprodutos baseadas exclusivamente no que foi observado nos comentários.
Cada produto deve ter um Product Opportunity Score de 0-100.
Todas as respostas em português brasileiro.`;

    const llmConfig = await getLLMConfig(userId);
    const llmRes = await callLLM(llmConfig, systemPrompt, userPrompt, {
      temperature: 0.7,
      max_tokens: 4000,
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.error('LLM API error:', errText);
      return new Response(JSON.stringify({ error: 'Erro na análise de IA' }), { status: 500 });
    }

    const llmData = await llmRes.json();
    const content = extractContent(llmConfig, llmData) || '{}';

    let analysis: any;
    try {
      const cleaned = content.replace(/```json\n?|```\n?/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = { rawContent: content };
    }

    // Save CommentAnalysis to DB
    const savedAnalysis = await prisma.commentAnalysis.create({
      data: {
        userId,
        youtubeVideoId: videoId,
        videoTitle: videoTitle || null,
        channelTitle: channelTitle || null,
        totalCommentsCollected: comments.length,
        usefulCommentsCount: analysis.summary?.usefulComments || comments.length,
        spamCommentsCount: analysis.summary?.totalAnalyzed ? comments.length - (analysis.summary.usefulComments || 0) : 0,
        topPains: JSON.stringify(analysis.pains || []),
        topDesires: JSON.stringify(analysis.desires || []),
        recurringQuestions: JSON.stringify(analysis.recurringQuestions || []),
        objections: JSON.stringify(analysis.objections || []),
        fears: JSON.stringify(analysis.fears || []),
        limitingBeliefs: JSON.stringify(analysis.limitingBeliefs || []),
        audienceLanguage: JSON.stringify(analysis.audienceLanguage || {}),
        marketInsights: JSON.stringify(analysis.marketInsights || {}),
        confidenceLevel: analysis.summary?.confidenceLevel || 'N/A',
        fullAnalysis: JSON.stringify(analysis),
      },
    });

    // Save InfoproductIdeas to DB and collect their IDs
    if (analysis.infoproductIdeas?.length) {
      for (let i = 0; i < analysis.infoproductIdeas.length; i++) {
        const idea = analysis.infoproductIdeas[i];
        const saved = await prisma.infoproductIdea.create({
          data: {
            userId,
            youtubeVideoId: videoId,
            commentAnalysisId: savedAnalysis.id,
            name: idea.name || 'Sem nome',
            productType: idea.productType || null,
            targetAudience: idea.targetAudience || null,
            mainPain: idea.mainPain || null,
            mainDesire: idea.mainDesire || null,
            promise: idea.promise || null,
            uniqueMechanism: idea.uniqueMechanism || null,
            recommendedFormat: idea.recommendedFormat || null,
            suggestedModules: JSON.stringify(idea.suggestedModules || []),
            suggestedTicket: idea.suggestedTicket || null,
            opportunityScore: idea.opportunityScore || 0,
            scoreReason: idea.scoreReason || null,
            productionEase: idea.productionEase || 0,
            salesPotential: idea.salesPotential || 0,
            marketRisk: idea.marketRisk || null,
            expectedObjections: JSON.stringify(idea.expectedObjections || []),
            leadMagnetIdea: idea.leadMagnetIdea || null,
            validationOffer: idea.validationOffer || null,
            youtubeSalesStrategy: idea.youtubeSalesStrategy || null,
          },
        });
        // Attach the DB id so the frontend can use it for save/generate actions
        analysis.infoproductIdeas[i]._dbId = saved.id;
      }
    }

    return new Response(JSON.stringify({
      analysisId: savedAnalysis.id,
      analysis,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Comment analysis error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro na análise' }), { status: 500 });
  }
}
