'use client';

import { useEffect, useState, useCallback } from 'react';
import { Kanban, Loader2, Plus, GripVertical, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const COLUMNS = ['Ideia', 'Roteiro', 'Thumbnail', 'Narração', 'Edição', 'Revisão', 'Publicado'];
const columnColors: Record<string, string> = {
  'Ideia': 'border-t-purple-500',
  'Roteiro': 'border-t-blue-500',
  'Thumbnail': 'border-t-yellow-500',
  'Narração': 'border-t-orange-500',
  'Edição': 'border-t-pink-500',
  'Revisão': 'border-t-cyan-500',
  'Publicado': 'border-t-emerald-500',
};

const priorityColors: Record<string, string> = {
  'alta': 'bg-red-500/20 text-red-400',
  'média': 'bg-yellow-500/20 text-yellow-400',
  'baixa': 'bg-blue-500/20 text-blue-400',
};

interface ProjectCard {
  id: string;
  title: string;
  niche: string;
  status: string;
  assignee: string | null;
  deadline: string | null;
  priority: string;
}

export default function BoardPage() {
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', niche: '', priority: 'média' });
  const [creating, setCreating] = useState(false);

  const fetchProjects = useCallback(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => setProjects(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedId) return;
    const project = projects?.find?.((p: any) => p?.id === draggedId);
    if (!project || project?.status === newStatus) { setDraggedId(null); return; }

    setProjects((prev) =>
      (prev ?? []).map((p: any) => p?.id === draggedId ? { ...(p ?? {}), status: newStatus } : p)
    );
    setDraggedId(null);

    try {
      await fetch(`/api/projects/${draggedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Movido para ${newStatus}`);
    } catch (e: any) {
      toast.error('Erro ao mover');
      fetchProjects();
    }
  };

  const handleCreate = async () => {
    if (!newProject?.title) { toast.error('Título é obrigatório'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        toast.success('Projeto criado!');
        setShowNewModal(false);
        setNewProject({ title: '', niche: '', priority: 'média' });
        fetchProjects();
      }
    } catch (e: any) { toast.error('Erro ao criar'); } finally { setCreating(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Production Board</h1>
          <p className="text-muted-foreground mt-1">Gerencie o fluxo de produção dos seus vídeos</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium rounded-md transition-all">
          <Plus className="h-4 w-4" /> Novo Projeto
        </button>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {COLUMNS?.map?.((col: string) => {
            const colProjects = (projects ?? []).filter((p: any) => p?.status === col);
            return (
              <div
                key={col}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col)}
                className={`w-64 flex-shrink-0 bg-card rounded-lg border border-border border-t-2 ${columnColors?.[col] ?? ''}`}
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                <div className="p-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{col}</h3>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{colProjects?.length ?? 0}</span>
                  </div>
                </div>
                <div className="p-2 space-y-2 min-h-[200px]">
                  {colProjects?.map?.((project: any) => (
                    <motion.div
                      key={project?.id}
                      layout
                      draggable
                      onDragStart={(e: any) => handleDragStart(e, project?.id)}
                      className={`bg-muted rounded-md p-3 cursor-grab active:cursor-grabbing border border-border hover:border-purple-500/30 transition-all ${draggedId === project?.id ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{project?.title ?? ''}</p>
                          {project?.niche ? <p className="text-xs text-muted-foreground mt-0.5">{project.niche}</p> : null}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColors?.[project?.priority] ?? 'bg-muted text-muted-foreground'}`}>
                              {project?.priority ?? ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )) ?? []}
                </div>
              </div>
            );
          }) ?? []}
        </div>
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowNewModal(false)}>
          <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()} style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Novo Projeto</h2>
              <button onClick={() => setShowNewModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Título *</label>
                <input type="text" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} className="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="Título do projeto" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nicho</label>
                <input type="text" value={newProject.niche} onChange={(e) => setNewProject({ ...newProject, niche: e.target.value })} className="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="Nicho do vídeo" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Prioridade</label>
                <select value={newProject.priority} onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })} className="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                  <option value="baixa">Baixa</option>
                  <option value="média">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <button onClick={handleCreate} disabled={creating} className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-md transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {creating ? 'Criando...' : 'Criar Projeto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
