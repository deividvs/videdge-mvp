export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });

    const body = await request.json();
    const { ideaId } = body || {};

    if (!ideaId) {
      return new Response(JSON.stringify({ error: 'ideaId é obrigatório' }), { status: 400 });
    }

    const idea = await prisma.infoproductIdea.findFirst({
      where: { id: ideaId, userId },
    });

    if (!idea) {
      return new Response(JSON.stringify({ error: 'Ideia não encontrada' }), { status: 404 });
    }

    await prisma.infoproductIdea.update({
      where: { id: ideaId },
      data: { saved: true },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Save infoproduct error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
