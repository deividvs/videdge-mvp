export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const scripts = await prisma.script.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { videoIdea: { select: { title: true, niche: true } } },
    });

    return NextResponse.json(scripts ?? []);
  } catch (error: any) {
    console.error('Scripts GET error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await request.json();
    const scriptData = body?.script ?? body ?? {};
    const videoIdeaId = body?.videoIdeaId ?? scriptData?.videoIdeaId;

    if (!videoIdeaId) return NextResponse.json({ error: 'videoIdeaId é obrigatório' }, { status: 400 });

    const script = await prisma.script.create({
      data: {
        userId,
        videoIdeaId,
        title: scriptData?.title ?? '',
        description: scriptData?.description ?? '',
        hook: scriptData?.hook ?? '',
        introduction: scriptData?.introduction ?? '',
        sectionOne: scriptData?.sectionOne ?? '',
        sectionTwo: scriptData?.sectionTwo ?? '',
        sectionThree: scriptData?.sectionThree ?? '',
        sectionFour: scriptData?.sectionFour ?? '',
        conclusion: scriptData?.conclusion ?? '',
        cta: scriptData?.cta ?? '',
        brollSuggestions: scriptData?.brollSuggestions ?? '',
        visualSuggestions: scriptData?.visualSuggestions ?? '',
        musicSuggestions: scriptData?.musicSuggestions ?? '',
        estimatedDuration: scriptData?.estimatedDuration ?? '',
      },
    });

    return NextResponse.json(script, { status: 201 });
  } catch (error: any) {
    console.error('Scripts POST error:', error);
    return NextResponse.json({ error: 'Erro ao salvar roteiro' }, { status: 500 });
  }
}
