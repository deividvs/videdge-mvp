export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getLLMConfig, callLLM, extractContent } from '@/lib/llm-config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });

    const body = await request.json();
    const { ideaId, type } = body || {};

    if (!ideaId || !type) {
      return new Response(JSON.stringify({ error: 'ideaId e type são obrigatórios' }), { status: 400 });
    }

    const idea = await prisma.infoproductIdea.findFirst({
      where: { id: ideaId, userId },
    });

    if (!idea) {
      return new Response(JSON.stringify({ error: 'Ideia não encontrada' }), { status: 404 });
    }

    let systemPrompt = '';
    let userPrompt = '';

    const productContext = `Produto: ${idea.name}\nTipo: ${idea.productType}\nPúblico: ${idea.targetAudience}\nDor principal: ${idea.mainPain}\nDesejo principal: ${idea.mainDesire}\nPromessa: ${idea.promise}\nMecanismo único: ${idea.uniqueMechanism}\nFormato: ${idea.recommendedFormat}\nTicket: ${idea.suggestedTicket}`;

    switch (type) {
      case 'offer':
        systemPrompt = `Você é um especialista em criação de ofertas irresistíveis para infoprodutos. Crie uma oferta completa com: headline, subheadline, promessa principal, lista de benefícios, módulos/conteúdo, bônus, garantia, preço/âncora de preço, CTA, urgency/scarcity e objeções respondidas. Tudo em português brasileiro. Responda em JSON.`;
        userPrompt = `Crie uma oferta irresistível para este infoproduto:\n\n${productContext}\n\nObjeções esperadas: ${idea.expectedObjections}\nLead magnet: ${idea.leadMagnetIdea}\n\nResponda em JSON com a estrutura: { "headline", "subheadline", "mainPromise", "benefits": [], "modules": [], "bonuses": [], "guarantee", "priceAnchor", "price", "cta", "urgency", "objectionsAnswered": [] }`;
        break;
      case 'vsl':
        systemPrompt = `Você é um copywriter especialista em VSL (Video Sales Letter) de alta conversão. Crie um roteiro de VSL completo com: hook, problema, agitação, solução, credibilidade, oferta, bônus, garantia, CTA, urge. Tudo em português brasileiro. Responda em JSON.`;
        userPrompt = `Crie um roteiro de VSL para este infoproduto:\n\n${productContext}\n\nResponda em JSON com: { "hook", "problem", "agitation", "solution", "credibility", "offer", "bonuses", "guarantee", "cta", "urgency", "estimatedDuration", "sections": [{"title", "script"}] }`;
        break;
      case 'salespage':
        systemPrompt = `Você é um copywriter especialista em páginas de vendas de alta conversão. Crie a estrutura completa de uma página de vendas com: headline, subheadline, lead, problema/agitação, solução, prova social, oferta, módulos, bônus, garantia, FAQ, CTA. Tudo em português brasileiro. Responda em JSON.`;
        userPrompt = `Crie a estrutura de página de vendas para este infoproduto:\n\n${productContext}\n\nResponda em JSON com: { "headline", "subheadline", "leadParagraph", "problemSection", "solutionSection", "socialProof": [], "modules": [{"name", "description"}], "bonuses": [{"name", "description"}], "guarantee", "faq": [{"question", "answer"}], "cta", "priceSection" }`;
        break;
      default:
        return new Response(JSON.stringify({ error: 'Tipo inválido. Use: offer, vsl, salespage' }), { status: 400 });
    }

    const llmConfig = await getLLMConfig(userId);
    const llmRes = await callLLM(llmConfig, systemPrompt, userPrompt, {
      temperature: 0.7,
      max_tokens: 4000,
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.error('LLM error:', errText);
      return new Response(JSON.stringify({ error: 'Erro na geração' }), { status: 500 });
    }

    const llmData = await llmRes.json();
    const content = extractContent(llmConfig, llmData) || '{}';

    let result;
    try {
      const cleaned = content.replace(/```json\n?|```\n?/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { rawContent: content };
    }

    // Persist the generated content to the DB so the user can work on it later.
    const fieldMap: Record<string, string> = {
      offer: 'generatedOffer',
      vsl: 'generatedVsl',
      salespage: 'generatedSalesPage',
    };
    const field = fieldMap[type];
    if (field) {
      await prisma.infoproductIdea.update({
        where: { id: ideaId },
        data: { [field]: JSON.stringify(result), saved: true },
      });
    }

    return new Response(JSON.stringify({ type, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Generate content error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
