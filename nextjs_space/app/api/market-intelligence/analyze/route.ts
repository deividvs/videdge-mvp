export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });

    const body = await request.json();
    const { videoTitle, channelTitle, viewCount, subscriberCount, viralScore, niche, description, opportunityId } = body || {};

    if (!videoTitle) {
      return new Response(JSON.stringify({ error: 'Título do vídeo é obrigatório' }), { status: 400 });
    }

    const systemPrompt = `Você é um estrategista sênior de YouTube especializado em canais faceless. Sua função é analisar oportunidades de mercado no YouTube e fornecer insights acionáveis.

Regras:
- Nunca instrua o usuário a copiar diretamente vídeos, títulos ou thumbnails.
- Foque em análise de padrões, adaptação e criação original.
- Seja objetivo e baseado em dados.
- Use linguagem profissional e direta.
- Todas as respostas devem ser em português brasileiro.

Responda EXCLUSIVAMENTE em JSON válido. Sem markdown, sem code blocks.

Estrutura exata:
{
  "whyItWorked": "Análise de por que o vídeo performou bem",
  "centralPromise": "Qual promessa central foi usada",
  "emotionExplored": "Qual emoção o título explora",
  "thumbnailAnalysis": "Análise do tipo de thumbnail que contribuiu para cliques",
  "targetAudience": "Público provável do vídeo",
  "sustainability": "Se o nicho é sustentável ou tendência passageira",
  "originalApproach": "Como criar uma versão original sem copiar",
  "derivedIdeas": ["Ideia 1", "Ideia 2", "Ideia 3", "Ideia 4", "Ideia 5", "Ideia 6", "Ideia 7", "Ideia 8", "Ideia 9", "Ideia 10"],
  "suggestedTitles": ["Título 1", "Título 2", "Título 3", "Título 4", "Título 5"],
  "nicheRecommendation": "Recomendação de entrada no nicho",
  "risks": "Riscos identificados",
  "competitionLevel": "baixo/médio/alto",
  "opportunityLevel": "baixo/médio/alto",
  "monetizationPotential": "baixo/médio/alto",
  "productionDifficulty": "baixo/médio/alto"
}`;

    const userPrompt = `Analise esta oportunidade de mercado no YouTube:

Vídeo: "${videoTitle}"
Canal: ${channelTitle || 'Desconhecido'}
Views: ${viewCount?.toLocaleString() || 'N/A'}
Inscritos do canal: ${subscriberCount?.toLocaleString() || 'N/A'}
Viral Score: ${viralScore || 'N/A'}/100
Nicho: ${niche || 'Não especificado'}
Descrição: ${description || 'N/A'}

Forneça uma análise completa desta oportunidade.`;

    const llmRes = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.error('LLM API error:', errText);
      return new Response(JSON.stringify({ error: 'Erro na análise de IA' }), { status: 500 });
    }

    const llmData = await llmRes.json();
    const content = llmData.choices?.[0]?.message?.content || '{}';

    let analysis;
    try {
      const cleaned = content.replace(/```json\n?|```\n?/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = { rawAnalysis: content };
    }

    // Update opportunity if ID provided
    if (opportunityId) {
      await prisma.nicheOpportunity.update({
        where: { id: opportunityId },
        data: {
          aiAnalysis: JSON.stringify(analysis),
          suggestedAngle: analysis.originalApproach || null,
          risks: analysis.risks || null,
          derivedIdeas: JSON.stringify(analysis.derivedIdeas || []),
          competitionLevel: analysis.competitionLevel || null,
          opportunityLevel: analysis.opportunityLevel || null,
          monetizationPotential: analysis.monetizationPotential || null,
          productionDifficulty: analysis.productionDifficulty || null,
          status: 'em análise',
        },
      });
    }

    return new Response(JSON.stringify({ analysis }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Opportunity analysis error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro na análise' }), { status: 500 });
  }
}
