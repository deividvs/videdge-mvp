'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lightbulb, FileText, Clapperboard, CheckCircle, ArrowRight, Loader2, FolderKanban, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardData {
  totalIdeas: number;
  totalScripts: number;
  inProduction: number;
  readyToPublish: number;
  recentProjects: Array<{
    id: string;
    title: string;
    niche: string;
    status: string;
    priority: string;
    updatedAt: string;
  }>;
}

const statusColors: Record<string, string> = {
  'Ideia': 'bg-purple-500/20 text-purple-400',
  'Roteiro': 'bg-blue-500/20 text-blue-400',
  'Thumbnail': 'bg-yellow-500/20 text-yellow-400',
  'Narração': 'bg-orange-500/20 text-orange-400',
  'Edição': 'bg-pink-500/20 text-pink-400',
  'Revisão': 'bg-cyan-500/20 text-cyan-400',
  'Publicado': 'bg-emerald-500/20 text-emerald-400',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const metrics = [
    { label: 'Ideias Geradas', value: data?.totalIdeas ?? 0, icon: Lightbulb, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
    { label: 'Roteiros Criados', value: data?.totalScripts ?? 0, icon: FileText, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    { label: 'Em Produção', value: data?.inProduction ?? 0, icon: Clapperboard, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
    { label: 'Publicados', value: data?.readyToPublish ?? 0, icon: CheckCircle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral da sua produção de conteúdo</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics?.map?.((m: any, i: number) => {
          const Icon = m?.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-lg p-5 border border-border hover:border-purple-500/30 transition-all"
              style={{ boxShadow: 'var(--shadow-md)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-md ${m?.bgColor ?? ''}`}>
                  {Icon ? <Icon className={`h-5 w-5 ${m?.color ?? ''}`} /> : null}
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold font-mono">{m?.value ?? 0}</p>
              <p className="text-sm text-muted-foreground mt-1">{m?.label ?? ''}</p>
            </motion.div>
          );
        }) ?? []}
      </div>

      <div className="bg-card rounded-lg border border-border" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold">Projetos Recentes</h2>
          </div>
          <Link href="/projects" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">Ver todos <ArrowRight className="h-3 w-3" /></Link>
        </div>
        {(data?.recentProjects?.length ?? 0) === 0 ? (
          <div className="p-8 text-center">
            <FolderKanban className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum projeto ainda</p>
            <Link href="/ideas/new" className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-md transition-colors">
              <Lightbulb className="h-4 w-4" /> Gerar Ideias
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data?.recentProjects?.map?.((p: any) => (
              <Link key={p?.id} href={`/projects/${p?.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium text-sm">{p?.title ?? 'Sem título'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p?.niche ?? ''}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors?.[p?.status] ?? 'bg-muted text-muted-foreground'}`}>{p?.status ?? ''}</span>
              </Link>
            )) ?? []}
          </div>
        )}
      </div>
    </div>
  );
}
