export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// List all saved infoproducts for the authenticated user.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });

    const ideas = await prisma.infoproductIdea.findMany({
      where: { userId, saved: true },
      orderBy: { updatedAt: 'desc' },
    });

    const parseJson = (val: string | null) => {
      if (!val) return null;
      try { return JSON.parse(val); } catch { return val; }
    };

    const result = ideas.map((idea) => ({
      id: idea.id,
      youtubeVideoId: idea.youtubeVideoId,
      name: idea.name,
      productType: idea.productType,
      targetAudience: idea.targetAudience,
      mainPain: idea.mainPain,
      mainDesire: idea.mainDesire,
      promise: idea.promise,
      uniqueMechanism: idea.uniqueMechanism,
      recommendedFormat: idea.recommendedFormat,
      suggestedModules: parseJson(idea.suggestedModules),
      suggestedTicket: idea.suggestedTicket,
      opportunityScore: idea.opportunityScore,
      scoreReason: idea.scoreReason,
      productionEase: idea.productionEase,
      salesPotential: idea.salesPotential,
      marketRisk: idea.marketRisk,
      expectedObjections: parseJson(idea.expectedObjections),
      leadMagnetIdea: idea.leadMagnetIdea,
      validationOffer: idea.validationOffer,
      youtubeSalesStrategy: idea.youtubeSalesStrategy,
      generatedOffer: parseJson(idea.generatedOffer),
      generatedVsl: parseJson(idea.generatedVsl),
      generatedSalesPage: parseJson(idea.generatedSalesPage),
      createdAt: idea.createdAt,
      updatedAt: idea.updatedAt,
    }));

    return new Response(JSON.stringify({ infoproducts: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('List infoproducts error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// Delete a saved infoproduct (unsave). Accepts { id } in the body.
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });

    const body = await request.json();
    const { id } = body || {};
    if (!id) return new Response(JSON.stringify({ error: 'id é obrigatório' }), { status: 400 });

    const idea = await prisma.infoproductIdea.findFirst({ where: { id, userId } });
    if (!idea) return new Response(JSON.stringify({ error: 'Produto não encontrado' }), { status: 404 });

    // Mark as not saved (removes it from the saved list without destroying analysis data).
    await prisma.infoproductIdea.update({
      where: { id },
      data: { saved: false },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Delete infoproduct error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
