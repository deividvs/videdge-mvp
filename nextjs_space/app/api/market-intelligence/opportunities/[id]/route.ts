export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;

    const opportunity = await prisma.nicheOpportunity.findFirst({
      where: { id: params.id, userId },
    });

    if (!opportunity) return NextResponse.json({ error: 'Oportunidade não encontrada' }, { status: 404 });
    return NextResponse.json({ opportunity });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao buscar oportunidade' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;

    const existing = await prisma.nicheOpportunity.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Oportunidade não encontrada' }, { status: 404 });

    const body = await request.json();
    const updated = await prisma.nicheOpportunity.update({
      where: { id: params.id },
      data: {
        status: body.status ?? existing.status,
        aiAnalysis: body.aiAnalysis ?? existing.aiAnalysis,
        suggestedAngle: body.suggestedAngle ?? existing.suggestedAngle,
        risks: body.risks ?? existing.risks,
        derivedIdeas: body.derivedIdeas ?? existing.derivedIdeas,
        competitionLevel: body.competitionLevel ?? existing.competitionLevel,
        opportunityLevel: body.opportunityLevel ?? existing.opportunityLevel,
        monetizationPotential: body.monetizationPotential ?? existing.monetizationPotential,
        productionDifficulty: body.productionDifficulty ?? existing.productionDifficulty,
      },
    });

    return NextResponse.json({ opportunity: updated });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao atualizar oportunidade' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;

    const existing = await prisma.nicheOpportunity.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Oportunidade não encontrada' }, { status: 404 });

    await prisma.nicheOpportunity.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao excluir oportunidade' }, { status: 500 });
  }
}
