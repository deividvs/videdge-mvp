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

    const ps = await prisma.pipelineSession.findFirst({
      where: { id: params.id, userId },
    });
    if (!ps) return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });

    return NextResponse.json({ session: ps });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;

    const existing = await prisma.pipelineSession.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });

    const body = await request.json();
    const updated = await prisma.pipelineSession.update({
      where: { id: params.id },
      data: {
        currentStage: body.currentStage ?? existing.currentStage,
        youtubeData: body.youtubeData ?? existing.youtubeData,
        stage1Result: body.stage1Result ?? existing.stage1Result,
        stage2Result: body.stage2Result ?? existing.stage2Result,
        stage3Result: body.stage3Result ?? existing.stage3Result,
        stage4Result: body.stage4Result ?? existing.stage4Result,
        stage5Result: body.stage5Result ?? existing.stage5Result,
        selectedIdeaIdx: body.selectedIdeaIdx ?? existing.selectedIdeaIdx,
      },
    });

    return NextResponse.json({ session: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;

    const existing = await prisma.pipelineSession.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });

    await prisma.pipelineSession.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
