export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { apiProvider: true, apiKey: true },
    });

    return new Response(JSON.stringify({
      apiProvider: user?.apiProvider || null,
      hasApiKey: !!user?.apiKey,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Settings GET error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });

    const body = await request.json();
    const { apiProvider, apiKey } = body;

    const updateData: any = {};

    if (apiProvider !== undefined) {
      updateData.apiProvider = apiProvider || null;
    }

    if (apiKey !== undefined) {
      updateData.apiKey = apiKey || null;
    }

    // If clearing provider, also clear key
    if (apiProvider === null || apiProvider === '') {
      updateData.apiProvider = null;
      updateData.apiKey = null;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Settings PUT error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
