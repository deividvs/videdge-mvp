export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - list user's pipeline sessions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;

    const sessions = await prisma.pipelineSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - create a new pipeline session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;

    const body = await request.json();
    const { niche, country, language, audience, channelType, channelGoal, videoDuration, contentTone } = body || {};

    if (!niche) return NextResponse.json({ error: 'Nicho é obrigatório' }, { status: 400 });

    const pipelineSession = await prisma.pipelineSession.create({
      data: {
        userId,
        niche,
        country: country || null,
        language: language || null,
        audience: audience || null,
        channelType: channelType || 'faceless',
        channelGoal: channelGoal || 'AdSense',
        videoDuration: videoDuration || '10 minutos',
        contentTone: contentTone || 'curioso',
        currentStage: 1,
      },
    });

    return NextResponse.json({ session: pipelineSession });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
