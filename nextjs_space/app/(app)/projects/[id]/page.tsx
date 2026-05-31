'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Trash2, FileText, Lightbulb, Calendar, User, Flag } from 'lucide-react';
import { toast } from 'sonner';

const STATUSES = ['Ideia', 'Roteiro', 'Thumbnail', 'Narração', 'Edição', 'Revisão', 'Publicado'];
const PRIORITIES = ['baixa', 'média', 'alta'];

const statusColors: Record<string, string> = {
  'Ideia': 'bg-purple-500/20 text-purple-400',
  'Roteiro': 'bg-blue-500/20 text-blue-400',
  'Thumbnail': 'bg-yellow-500/20 text-yellow-400',
  'Narração': 'bg-orange-500/20 text-orange-400',
  'Edição': 'bg-pink-500/20 text-pink-400',
  'Revisão': 'bg-cyan-500/20 text-cyan-400',
  'Publicado': 'bg-emerald-500/20 text-emerald-400',
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/projects/${params.id}`)
      .then((r) => r.json())
      .then((d) => { if (d?.id) { setProject(d); setEditData({ status: d?.status, priority: d?.priority, assignee: d?.assignee ?? '', notes: d?.notes ?? '', deadline: d?.deadline ? new Date(d.deadline).toISOString().split('T')[0] : '' }); } })
      .catch(() => toast.error('Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [params?.id]);

  const handleSave = async () => {
    if (!project?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const updated = await res.json();
        setProject(updated);
        toast.success('Projeto salvo!');
      }
    } catch (e: any) { toast.error('Erro ao salvar'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
    try {
      await fetch(`/api/projects/${project?.id}`, { method: 'DELETE' });
      toast.success('Projeto excluído');
      router.push('/projects');
    } catch (e: any) { toast.error('Erro ao excluir'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;
  if (!project) return <div className="text-center py-12"><p className="text-muted-foreground">Projeto não encontrado</p><Link href="/projects" className="text-purple-400 text-sm">Voltar</Link></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="p-2 rounded-md hover:bg-muted transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight">{project?.title ?? ''}</h1>
            <p className="text-sm text-muted-foreground">{project?.niche ?? ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
          </button>
          <button onClick={handleDelete} className="p-2 rounded-md hover:bg-red-500/10 text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5 space-y-4" style={{ boxShadow: 'var(--shadow-md)' }}>
          <h2 className="font-semibold flex items-center gap-2"><Flag className="h-4 w-4 text-purple-400" /> Status & Prioridade</h2>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s: string) => (
                <button key={s} onClick={() => setEditData({ ...(editData ?? {}), status: s })} className={`text-xs px-3 py-1.5 rounded-md border transition-all ${editData?.status === s ? `${statusColors?.[s] ?? ''} border-current` : 'border-border text-muted-foreground hover:text-foreground'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Prioridade</label>
            <select value={editData?.priority ?? 'média'} onChange={(e) => setEditData({ ...(editData ?? {}), priority: e.target.value })} className="w-full px-3 py-2 bg-muted border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50">
              {PRIORITIES.map((p: string) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block flex items-center gap-1"><User className="h-3 w-3" /> Responsável</label>
            <input type="text" value={editData?.assignee ?? ''} onChange={(e) => setEditData({ ...(editData ?? {}), assignee: e.target.value })} className="w-full px-3 py-2 bg-muted border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="Nome do responsável" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block flex items-center gap-1"><Calendar className="h-3 w-3" /> Prazo</label>
            <input type="date" value={editData?.deadline ?? ''} onChange={(e) => setEditData({ ...(editData ?? {}), deadline: e.target.value })} className="w-full px-3 py-2 bg-muted border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
          </div>
        </div>

        <div className="space-y-4">
          {project?.videoIdea ? (
            <div className="bg-card rounded-lg border border-border p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <h2 className="font-semibold flex items-center gap-2 mb-3"><Lightbulb className="h-4 w-4 text-yellow-400" /> Ideia Vinculada</h2>
              <p className="text-sm font-medium">{project?.videoIdea?.title ?? ''}</p>
              <p className="text-xs text-muted-foreground mt-1">{project?.videoIdea?.hook ?? ''}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">{project?.videoIdea?.niche ?? ''}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Viral: {project?.videoIdea?.viralPotential ?? 0}/10</span>
              </div>
            </div>
          ) : null}

          {project?.script ? (
            <div className="bg-card rounded-lg border border-border p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <h2 className="font-semibold flex items-center gap-2 mb-3"><FileText className="h-4 w-4 text-blue-400" /> Roteiro</h2>
              <p className="text-sm">{project?.script?.title ?? ''}</p>
              <Link href={`/scripts/${project?.script?.id}`} className="text-xs text-purple-400 hover:text-purple-300 mt-2 inline-block">Ver roteiro completo →</Link>
            </div>
          ) : null}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
        <h2 className="font-semibold mb-3">Observações</h2>
        <textarea value={editData?.notes ?? ''} onChange={(e) => setEditData({ ...(editData ?? {}), notes: e.target.value })} className="w-full min-h-[120px] bg-muted border border-border rounded-md p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y" placeholder="Adicione observações sobre este projeto..." />
      </div>
    </div>
  );
}
