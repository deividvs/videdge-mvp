'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lightbulb, Plus, Loader2, Trash2, Zap, FileText, FolderKanban, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface VideoIdea {
  id: string;
  title: string;
  alternativeTitle: string | null;
  niche: string;
  audience: string;
  objective: string;
  tone: string;
  hook: string;
  promise: string;
  viralPotential: number;
  productionDifficulty: number;
  strategicReason: string;
  createdAt: string;
  _count: { scripts: number; projects: number };
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIdeas = () => {
    setLoading(true);
    fetch('/api/ideas')
      .then((r) => r.json())
      .then((d) => setIdeas(Array.isArray(d) ? d : []))
      .catch(() => toast.error('Erro ao carregar ideias'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchIdeas(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ideia?')) return;
    try {
      await fetch(`/api/ideas?id=${id}`, { method: 'DELETE' });
      setIdeas((prev) => (prev ?? []).filter((i: any) => i?.id !== id));
      toast.success('Ideia excluída');
    } catch (e: any) {
      toast.error('Erro ao excluir');
    }
  };

  const handleCreateProject = async (idea: VideoIdea) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: idea?.title ?? '', niche: idea?.niche ?? '', videoIdeaId: idea?.id }),
      });
      if (res.ok) {
        toast.success('Projeto criado com sucesso!');
        fetchIdeas();
      }
    } catch (e: any) {
      toast.error('Erro ao criar projeto');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Video Ideas</h1>
          <p className="text-muted-foreground mt-1">Suas ideias de vídeos geradas por IA</p>
        </div>
        <Link href="/ideas/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium rounded-md transition-all">
          <Plus className="h-4 w-4" /> Gerar Ideias
        </Link>
      </div>

      {(ideas?.length ?? 0) === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center" style={{ boxShadow: 'var(--shadow-md)' }}>
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Nenhuma ideia ainda</h2>
          <p className="text-sm text-muted-foreground mb-4">Comece gerando suas primeiras ideias de vídeo com IA</p>
          <Link href="/ideas/new" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-md transition-colors">
            <Zap className="h-4 w-4" /> Gerar Ideias
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {ideas?.map?.((idea: any, i: number) => (
            <motion.div
              key={idea?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-lg border border-border p-5 hover:border-purple-500/30 transition-all group"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate">{idea?.title ?? ''}</h3>
                  {idea?.alternativeTitle ? <p className="text-xs text-muted-foreground mt-0.5 truncate">Alt: {idea.alternativeTitle}</p> : null}
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{idea?.hook ?? ''}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400">{idea?.niche ?? ''}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">{idea?.tone ?? ''}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Viral: {idea?.viralPotential ?? 0}/10</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/scripts?ideaId=${idea?.id}`} className="p-2 rounded-md hover:bg-blue-500/10 text-blue-400 transition-colors" title="Gerar roteiro">
                    <FileText className="h-4 w-4" />
                  </Link>
                  <button onClick={() => handleCreateProject(idea)} className="p-2 rounded-md hover:bg-emerald-500/10 text-emerald-400 transition-colors" title="Criar projeto">
                    <FolderKanban className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(idea?.id)} className="p-2 rounded-md hover:bg-red-500/10 text-red-400 transition-colors" title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )) ?? []}
        </div>
      )}
    </div>
  );
}
