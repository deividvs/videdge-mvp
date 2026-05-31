'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Loader2, ArrowLeft, Lightbulb, TrendingUp, AlertTriangle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';

const objectives = ['Viralizar', 'Vender', 'Educar', 'Gerar inscritos', 'Gerar autoridade'];
const durations = ['5min', '8min', '10min', '15min', '20min'];
const tones = ['Curioso', 'Dramático', 'Educativo', 'Polêmico', 'Inspirador', 'Investigativo'];

interface GeneratedIdea {
  title: string;
  alternativeTitle: string;
  hook: string;
  promise: string;
  summaryStructure: string;
  viralPotential: number;
  productionDifficulty: number;
  strategicReason: string;
}

export default function NewIdeasPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    niche: '',
    audience: '',
    objective: objectives[0] ?? '',
    duration: durations[2] ?? '',
    tone: tones[0] ?? '',
  });
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!formData?.niche || !formData?.audience) {
      toast.error('Preencha o nicho e público-alvo');
      return;
    }
    setGenerating(true);
    setProgress(0);
    setIdeas([]);

    try {
      const response = await fetch('/api/ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Erro ao gerar ideias');
      }

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
                const ideasArr = result?.ideas ?? [];
                setIdeas(ideasArr);
                setProgress(100);
                return;
              } else if (parsed?.status === 'error') {
                throw new Error(parsed?.message ?? 'Erro na geração');
              }
            } catch (e: any) {
              if (e?.message && e.message !== 'Unexpected end of JSON input') {
                // pass
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Generate error:', error);
      toast.error(error?.message ?? 'Erro ao gerar ideias');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if ((ideas?.length ?? 0) === 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideas, formData }),
      });
      if (res.ok) {
        toast.success('Ideias salvas com sucesso!');
        router.push('/ideas');
      } else {
        toast.error('Erro ao salvar ideias');
      }
    } catch (e: any) {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ideas" className="p-2 rounded-md hover:bg-muted transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Gerar Ideias de Vídeo</h1>
          <p className="text-muted-foreground mt-1">Use IA para gerar ideias com alto potencial viral</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nicho *</label>
            <input type="text" value={formData.niche} onChange={(e) => setFormData({ ...formData, niche: e.target.value })} placeholder="Ex: Finanças pessoais, História, Tecnologia..." className="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Público-alvo *</label>
            <input type="text" value={formData.audience} onChange={(e) => setFormData({ ...formData, audience: e.target.value })} placeholder="Ex: Jovens 18-35, empreendedores..." className="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Objetivo</label>
            <select value={formData.objective} onChange={(e) => setFormData({ ...formData, objective: e.target.value })} className="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all">
              {objectives.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Duração desejada</label>
            <select value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all">
              {durations.map((d: string) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1.5 block">Tom do vídeo</label>
            <div className="flex flex-wrap gap-2">
              {tones.map((t: string) => (
                <button key={t} type="button" onClick={() => setFormData({ ...formData, tone: t })} className={`px-3 py-1.5 text-sm rounded-md border transition-all ${formData.tone === t ? 'bg-purple-600 border-purple-500 text-white' : 'border-border text-muted-foreground hover:border-purple-500/50 hover:text-foreground'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <button onClick={handleGenerate} disabled={generating} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-md transition-all disabled:opacity-50">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {generating ? 'Gerando Ideias...' : 'Gerar 10 Ideias'}
          </button>
        </div>
      </div>

      {generating && (
        <div className="bg-card rounded-lg border border-border p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
            <p className="text-sm font-medium">Gerando ideias com IA...</p>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Isso pode levar alguns segundos</p>
        </div>
      )}

      {(ideas?.length ?? 0) > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Lightbulb className="h-5 w-5 text-purple-400" /> {ideas?.length ?? 0} Ideias Geradas</h2>
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Salvando...' : 'Salvar Todas'}
            </button>
          </div>
          {ideas?.map?.((idea: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-lg border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <button onClick={() => setExpandedId(expandedId === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-purple-400">#{i + 1}</span>
                    <h3 className="font-semibold truncate">{idea?.title ?? ''}</h3>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs flex items-center gap-1 text-emerald-400"><TrendingUp className="h-3 w-3" /> Viral: {idea?.viralPotential ?? 0}/10</span>
                    <span className="text-xs flex items-center gap-1 text-orange-400"><AlertTriangle className="h-3 w-3" /> Dific.: {idea?.productionDifficulty ?? 0}/10</span>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${expandedId === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {expandedId === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
                      {idea?.alternativeTitle ? <div><span className="text-xs text-muted-foreground">Título Alternativo</span><p className="text-sm">{idea.alternativeTitle}</p></div> : null}
                      <div><span className="text-xs text-muted-foreground">Hook</span><p className="text-sm">{idea?.hook ?? ''}</p></div>
                      <div><span className="text-xs text-muted-foreground">Promessa</span><p className="text-sm">{idea?.promise ?? ''}</p></div>
                      <div><span className="text-xs text-muted-foreground">Estrutura</span><p className="text-sm whitespace-pre-line">{idea?.summaryStructure ?? ''}</p></div>
                      <div><span className="text-xs text-muted-foreground">Motivo Estratégico</span><p className="text-sm">{idea?.strategicReason ?? ''}</p></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )) ?? []}
        </div>
      )}
    </div>
  );
}
