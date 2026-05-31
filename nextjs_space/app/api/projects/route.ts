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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const niche = searchParams.get('niche');

    const where: any = { userId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (niche) where.niche = { contains: niche };

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        videoIdea: { select: { title: true, niche: true, viralPotential: true } },
        script: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(projects ?? []);
  } catch (error: any) {
    console.error('Projects GET error:', error);
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
    const project = await prisma.project.create({
      data: {
        userId,
        title: body?.title ?? 'Novo Projeto',
        niche: body?.niche ?? '',
        videoIdeaId: body?.videoIdeaId ?? null,
        scriptId: body?.scriptId ?? null,
        status: body?.status ?? 'Ideia',
        priority: body?.priority ?? 'média',
        assignee: body?.assignee ?? null,
        deadline: body?.deadline ? new Date(body.deadline) : null,
        notes: body?.notes ?? null,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error('Projects POST error:', error);
    return NextResponse.json({ error: 'Erro ao criar projeto' }, { status: 500 });
  }
}
