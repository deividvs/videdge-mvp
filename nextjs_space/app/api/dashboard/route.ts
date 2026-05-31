export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const [totalIdeas, totalScripts, inProduction, readyToPublish, recentProjects] = await Promise.all([
      prisma.videoIdea.count({ where: { userId } }),
      prisma.script.count({ where: { userId } }),
      prisma.project.count({ where: { userId, status: { in: ['Narração', 'Edição', 'Revisão', 'Thumbnail'] } } }),
      prisma.project.count({ where: { userId, status: 'Publicado' } }),
      prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { videoIdea: { select: { title: true, niche: true } } },
      }),
    ]);

    return NextResponse.json({
      totalIdeas,
      totalScripts,
      inProduction,
      readyToPublish,
      recentProjects: recentProjects?.map?.((p: any) => ({
        id: p?.id,
        title: p?.title ?? p?.videoIdea?.title ?? 'Sem título',
        niche: p?.niche ?? p?.videoIdea?.niche ?? '',
        status: p?.status ?? 'Ideia',
        priority: p?.priority ?? 'média',
        updatedAt: p?.updatedAt?.toISOString?.() ?? '',
      })) ?? [],
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
