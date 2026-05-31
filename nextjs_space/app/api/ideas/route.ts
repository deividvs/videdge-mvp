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

    const ideas = await prisma.videoIdea.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { scripts: true, projects: true } } },
    });

    return NextResponse.json(ideas ?? []);
  } catch (error: any) {
    console.error('Ideas GET error:', error);
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
    const ideas = body?.ideas ?? [];
    const formData = body?.formData ?? {};

    const created = await Promise.all(
      (ideas ?? []).map((idea: any) =>
        prisma.videoIdea.create({
          data: {
            userId,
            niche: formData?.niche ?? '',
            audience: formData?.audience ?? '',
            objective: formData?.objective ?? '',
            duration: formData?.duration ?? '',
            tone: formData?.tone ?? '',
            title: idea?.title ?? '',
            alternativeTitle: idea?.alternativeTitle ?? null,
            hook: idea?.hook ?? '',
            promise: idea?.promise ?? '',
            summaryStructure: idea?.summaryStructure ?? '',
            viralPotential: Number(idea?.viralPotential) || 0,
            productionDifficulty: Number(idea?.productionDifficulty) || 0,
            strategicReason: idea?.strategicReason ?? '',
          },
        })
      )
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Ideas POST error:', error);
    return NextResponse.json({ error: 'Erro ao salvar ideias' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    await prisma.videoIdea.deleteMany({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Ideas DELETE error:', error);
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}
