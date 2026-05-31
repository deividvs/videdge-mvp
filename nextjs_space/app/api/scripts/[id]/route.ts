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

    const script = await prisma.script.findFirst({
      where: { id: params?.id, userId },
      include: { videoIdea: true },
    });

    if (!script) return NextResponse.json({ error: 'Roteiro não encontrado' }, { status: 404 });
    return NextResponse.json(script);
  } catch (error: any) {
    console.error('Script GET error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;

    const body = await request.json();
    const existing = await prisma.script.findFirst({ where: { id: params?.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Roteiro não encontrado' }, { status: 404 });

    const script = await prisma.script.update({
      where: { id: params?.id },
      data: {
        title: body?.title ?? existing.title,
        description: body?.description ?? existing.description,
        hook: body?.hook ?? existing.hook,
        introduction: body?.introduction ?? existing.introduction,
        sectionOne: body?.sectionOne ?? existing.sectionOne,
        sectionTwo: body?.sectionTwo ?? existing.sectionTwo,
        sectionThree: body?.sectionThree ?? existing.sectionThree,
        sectionFour: body?.sectionFour ?? existing.sectionFour,
        conclusion: body?.conclusion ?? existing.conclusion,
        cta: body?.cta ?? existing.cta,
        brollSuggestions: body?.brollSuggestions ?? existing.brollSuggestions,
        visualSuggestions: body?.visualSuggestions ?? existing.visualSuggestions,
        musicSuggestions: body?.musicSuggestions ?? existing.musicSuggestions,
        estimatedDuration: body?.estimatedDuration ?? existing.estimatedDuration,
      },
    });

    return NextResponse.json(script);
  } catch (error: any) {
    console.error('Script PUT error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;

    await prisma.script.deleteMany({ where: { id: params?.id, userId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Script DELETE error:', error);
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}
