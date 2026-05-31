'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FolderKanban, Loader2, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

const statusOptions = ['Todos', 'Ideia', 'Roteiro', 'Thumbnail', 'Narração', 'Edição', 'Revisão', 'Publicado'];
const priorityOptions = ['Todos', 'baixa', 'média', 'alta'];

const statusColors: Record<string, string> = {
  'Ideia': 'bg-purple-500/20 text-purple-400',
  'Roteiro': 'bg-blue-500/20 text-blue-400',
  'Thumbnail': 'bg-yellow-500/20 text-yellow-400',
  'Narração': 'bg-orange-500/20 text-orange-400',
  'Edição': 'bg-pink-500/20 text-pink-400',
  'Revisão': 'bg-cyan-500/20 text-cyan-400',
  'Publicado': 'bg-emerald-500/20 text-emerald-400',
};

const priorityColors: Record<string, string> = {
  'alta': 'bg-red-500/20 text-red-400',
  'média': 'bg-yellow-500/20 text-yellow-400',
  'baixa': 'bg-blue-500/20 text-blue-400',
};

interface ProjectItem {
  id: string;
  title: string;
  niche: string;
  status: string;
  priority: string;
  assignee: string | null;
  deadline: string | null;
  createdAt: string;
  videoIdea: { title: string; niche: string; viralPotential: number } | null;
  script: { id: string; title: string } | null;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterPriority, setFilterPriority] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => setProjects(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = (projects ?? []).filter((p: any) => {
    if (filterStatus !== 'Todos' && p?.status !== filterStatus) return false;
    if (filterPriority !== 'Todos' && p?.priority !== filterPriority) return false;
    if (searchQuery && !(p?.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()) && !(p?.niche ?? '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground mt-1">Todos os seus projetos de vídeo</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar projetos..." className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-muted border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50">
            {statusOptions.map((s: string) => <option key={s} value={s}>{s === 'Todos' ? 'Status: Todos' : s}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-3 py-2 bg-muted border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50">
            {priorityOptions.map((p: string) => <option key={p} value={p}>{p === 'Todos' ? 'Prioridade: Todos' : p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {(filtered?.length ?? 0) === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center" style={{ boxShadow: 'var(--shadow-md)' }}>
          <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h2>
          <p className="text-sm text-muted-foreground">Crie projetos a partir das suas ideias ou do Production Board</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered?.map?.((project: any, i: number) => (
            <motion.div key={project?.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={`/projects/${project?.id}`} className="block bg-card rounded-lg border border-border p-5 hover:border-purple-500/30 transition-all" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{project?.title ?? 'Sem título'}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{project?.niche ?? ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors?.[project?.status] ?? 'bg-muted text-muted-foreground'}`}>{project?.status ?? ''}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${priorityColors?.[project?.priority] ?? 'bg-muted text-muted-foreground'}`}>{project?.priority ?? ''}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )) ?? []}
        </div>
      )}
    </div>
  );
}
