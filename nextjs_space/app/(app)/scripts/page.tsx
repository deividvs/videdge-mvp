'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, Loader2, Zap, Clock, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ScriptItem {
  id: string;
  title: string;
  estimatedDuration: string;
  createdAt: string;
  videoIdea: { title: string; niche: string } | null;
}

interface IdeaForScript {
  id: string;
  title: string;
  niche: string;
  hook: string;
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ideas, setIdeas] = useState<IdeaForScript[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const ideaIdParam = searchParams?.get?.('ideaId') ?? null;

  const fetchScripts = () => {
    fetch('/api/scripts').then((r) => r.json()).then((d) => setScripts(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScripts();
    fetch('/api/ideas').then((r) => r.json()).then((d) => {
      setIdeas(Array.isArray(d) ? d : []);
      if (ideaIdParam) setSelectedIdeaId(ideaIdParam);
    }).catch(() => {});
  }, [ideaIdParam]);

  const handleGenerate = async () => {
    if (!selectedIdeaId) { toast.error('Selecione uma ideia'); return; }
    setGenerating(true);
    setProgress(0);
    try {
      const response = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIdeaId: selectedIdeaId }),
      });
      if (!response.ok) throw new Error('Erro ao gerar');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Sem resposta');
      const decoder = new TextDecoder();
      let partialRead = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partialRead += decoder.decode(value, { stream: true });
        let lines = partialRead.split('\n');
        partialRead = lines.pop() ?? '';
        for (const line of lines) {
          if (line?.startsWith?.('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data);
              if (parsed?.status === 'processing') {
                setProgress((prev) => Math.min(prev + 1, 99));
              } else if (parsed?.status === 'completed') {
                const result = parsed?.result;
                // Save to database
                const saveRes = await fetch('/api/scripts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ videoIdeaId: selectedIdeaId, script: result }),
                });
                if (saveRes.ok) {
                  toast.success('Roteiro gerado e salvo!');
                  fetchScripts();
                }
                setProgress(100);
                return;
              } else if (parsed?.status === 'error') {
                throw new Error(parsed?.message ?? 'Erro');
              }
            } catch (e: any) {}
          }
        }
      }
    } catch (error: any) {
      toast.error(error?.message ?? 'Erro ao gerar roteiro');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este roteiro?')) return;
    try {
      await fetch(`/api/scripts/${id}`, { method: 'DELETE' });
      setScripts((prev) => (prev ?? []).filter((s: any) => s?.id !== id));
      toast.success('Roteiro excluído');
    } catch (e: any) { toast.error('Erro ao excluir'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Scripts</h1>
        <p className="text-muted-foreground mt-1">Roteiros gerados por IA para seus vídeos</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-purple-400" /> Gerar Novo Roteiro</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={selectedIdeaId ?? ''} onChange={(e) => setSelectedIdeaId(e.target.value || null)} className="flex-1 px-4 py-2.5 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50">
            <option value="">Selecione uma ideia...</option>
            {ideas?.map?.((idea: any) => <option key={idea?.id} value={idea?.id}>{idea?.title ?? ''}</option>) ?? []}
          </select>
          <button onClick={handleGenerate} disabled={generating || !selectedIdeaId} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-md transition-all disabled:opacity-50">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {generating ? 'Gerando...' : 'Gerar Roteiro'}
          </button>
        </div>
        {generating && (
          <div className="mt-4">
            <div className="w-full bg-muted rounded-full h-2"><div className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} /></div>
            <p className="text-xs text-muted-foreground mt-2">Gerando roteiro completo...</p>
          </div>
        )}
      </div>

      {(scripts?.length ?? 0) === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center" style={{ boxShadow: 'var(--shadow-md)' }}>
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Nenhum roteiro ainda</h2>
          <p className="text-sm text-muted-foreground">Selecione uma ideia acima para gerar um roteiro</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {scripts?.map?.((script: any, i: number) => (
            <motion.div key={script?.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="bg-card rounded-lg border border-border p-5 hover:border-blue-500/30 transition-all flex items-center justify-between" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <Link href={`/scripts/${script?.id}`} className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{script?.title ?? 'Sem título'}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{script?.videoIdea?.title ?? ''}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {script?.estimatedDuration ?? ''}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{script?.videoIdea?.niche ?? ''}</span>
                  </div>
                </Link>
                <button onClick={() => handleDelete(script?.id)} className="p-2 rounded-md hover:bg-red-500/10 text-red-400 transition-colors ml-2"><Trash2 className="h-4 w-4" /></button>
              </div>
            </motion.div>
          )) ?? []}
        </div>
      )}
    </div>
  );
}
