export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;

    const project = await prisma.project.findFirst({
      where: { id: params?.id, userId },
      include: {
        videoIdea: true,
        script: true,
      },
    });

    if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Project GET error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;

    const body = await request.json();
    const existing = await prisma.project.findFirst({ where: { id: params?.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });

    const project = await prisma.project.update({
      where: { id: params?.id },
      data: {
        title: body?.title ?? existing.title,
        niche: body?.niche ?? existing.niche,
        status: body?.status ?? existing.status,
        priority: body?.priority ?? existing.priority,
        assignee: body?.assignee !== undefined ? body.assignee : existing.assignee,
        deadline: body?.deadline !== undefined ? (body.deadline ? new Date(body.deadline) : null) : existing.deadline,
        notes: body?.notes !== undefined ? body.notes : existing.notes,
      },
    });

    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Project PUT error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;

    await prisma.project.deleteMany({ where: { id: params?.id, userId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Project DELETE error:', error);
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}
