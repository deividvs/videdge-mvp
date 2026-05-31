export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const opportunities = await prisma.nicheOpportunity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ opportunities });
  } catch (error: any) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json({ error: 'Erro ao buscar oportunidades' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await request.json();
    const {
      niche, subniche, description, referenceVideoId, referenceVideoTitle,
      referenceChannelTitle, viralScore, estimatedRevenue, averageViews, averageViewsPerDay,
    } = body || {};

    const opportunity = await prisma.nicheOpportunity.create({
      data: {
        userId,
        niche: niche || '',
        subniche: subniche || null,
        description: description || null,
        referenceVideoId: referenceVideoId || null,
        referenceVideoTitle: referenceVideoTitle || null,
        referenceChannelTitle: referenceChannelTitle || null,
        viralScore: viralScore || null,
        estimatedRevenue: estimatedRevenue || null,
        averageViews: averageViews || null,
        averageViewsPerDay: averageViewsPerDay || null,
        status: 'nova',
      },
    });

    return NextResponse.json({ opportunity });
  } catch (error: any) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json({ error: 'Erro ao salvar oportunidade' }, { status: 500 });
  }
}
