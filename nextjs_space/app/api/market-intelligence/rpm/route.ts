export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DEFAULT_RPM_BENCHMARKS } from '@/lib/revenue-estimator';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const benchmarks = await prisma.rPMBenchmark.findMany({
      orderBy: { niche: 'asc' },
    });

    // If no benchmarks in DB, return defaults
    if (benchmarks.length === 0) {
      const defaults = Object.entries(DEFAULT_RPM_BENCHMARKS).map(([niche, values]) => ({
        id: niche,
        niche,
        country: 'global',
        language: 'all',
        rpmConservative: values.conservative,
        rpmAverage: values.average,
        rpmAggressive: values.aggressive,
        sourceNote: 'Valores padrão estimados',
      }));
      return NextResponse.json({ benchmarks: defaults });
    }

    return NextResponse.json({ benchmarks });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao buscar benchmarks' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await request.json();
    const { niche, rpmConservative, rpmAverage, rpmAggressive, country, language, sourceNote } = body || {};

    if (!niche) return NextResponse.json({ error: 'Nicho é obrigatório' }, { status: 400 });

    const benchmark = await prisma.rPMBenchmark.upsert({
      where: {
        niche_country_language: {
          niche: niche.toLowerCase(),
          country: country || 'global',
          language: language || 'all',
        },
      },
      update: {
        rpmConservative: Number(rpmConservative),
        rpmAverage: Number(rpmAverage),
        rpmAggressive: Number(rpmAggressive),
        sourceNote: sourceNote || null,
      },
      create: {
        niche: niche.toLowerCase(),
        country: country || 'global',
        language: language || 'all',
        rpmConservative: Number(rpmConservative),
        rpmAverage: Number(rpmAverage),
        rpmAggressive: Number(rpmAggressive),
        sourceNote: sourceNote || null,
      },
    });

    return NextResponse.json({ benchmark });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao atualizar benchmark' }, { status: 500 });
  }
}
