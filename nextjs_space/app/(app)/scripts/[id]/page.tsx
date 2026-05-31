'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, FileText, Music, Image, Film, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ScriptData {
  id: string;
  title: string;
  description: string;
  hook: string;
  introduction: string;
  sectionOne: string;
  sectionTwo: string;
  sectionThree: string;
  sectionFour: string;
  conclusion: string;
  cta: string;
  brollSuggestions: string;
  visualSuggestions: string;
  musicSuggestions: string;
  estimatedDuration: string;
  videoIdea: { title: string; niche: string; audience: string } | null;
}

const sections = [
  { key: 'hook', label: 'Hook (15s)', icon: '\u26A1' },
  { key: 'introduction', label: 'Introdução', icon: '\uD83C\uDFAC' },
  { key: 'sectionOne', label: 'Seção 1', icon: '1\uFE0F\u20E3' },
  { key: 'sectionTwo', label: 'Seção 2', icon: '2\uFE0F\u20E3' },
  { key: 'sectionThree', label: 'Seção 3', icon: '3\uFE0F\u20E3' },
  { key: 'sectionFour', label: 'Seção 4', icon: '4\uFE0F\u20E3' },
  { key: 'conclusion', label: 'Conclusão', icon: '\uD83C\uDFC1' },
  { key: 'cta', label: 'CTA Final', icon: '\uD83D\uDCE2' },
];

export default function ScriptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [script, setScript] = useState<ScriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/scripts/${params.id}`)
      .then((r) => r.json())
      .then((d) => { if (d?.id) setScript(d); })
      .catch(() => toast.error('Erro ao carregar roteiro'))
      .finally(() => setLoading(false));
  }, [params?.id]);

  const handleFieldChange = (key: string, value: string) => {
    setEditedFields((prev) => ({ ...(prev ?? {}), [key]: value }));
  };

  const getFieldValue = (key: string) => {
    return editedFields?.[key] ?? (script as any)?.[key] ?? '';
  };

  const handleSave = async () => {
    if (!script?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/scripts/${script.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedFields),
      });
      if (res.ok) {
        const updated = await res.json();
        setScript(updated);
        setEditedFields({});
        toast.success('Roteiro salvo!');
      }
    } catch (e: any) {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;
  if (!script) return <div className="text-center py-12"><p className="text-muted-foreground">Roteiro não encontrado</p><Link href="/scripts" className="text-purple-400 hover:text-purple-300 text-sm">Voltar</Link></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/scripts" className="p-2 rounded-md hover:bg-muted transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight">{script?.title ?? ''}</h1>
            <p className="text-sm text-muted-foreground">{script?.videoIdea?.title ?? ''} · {script?.videoIdea?.niche ?? ''}</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || Object.keys(editedFields ?? {}).length === 0} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div className="flex items-center gap-2 mb-3"><FileText className="h-4 w-4 text-blue-400" /><h2 className="font-semibold">Descrição Estratégica</h2></div>
        <textarea value={getFieldValue('description')} onChange={(e) => handleFieldChange('description', e.target.value)} className="w-full min-h-[80px] bg-muted border border-border rounded-md p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y" />
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> Duração estimada: {script?.estimatedDuration ?? 'N/A'}</div>

      <div className="space-y-4">
        {sections?.map?.((s: any) => (
          <div key={s?.key} className="bg-card rounded-lg border border-border p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <span>{s?.icon ?? ''}</span> {s?.label ?? ''}
            </h3>
            <textarea value={getFieldValue(s?.key ?? '')} onChange={(e) => handleFieldChange(s?.key ?? '', e.target.value)} className="w-full min-h-[120px] bg-muted border border-border rounded-md p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y" />
          </div>
        )) ?? []}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-2 mb-3"><Film className="h-4 w-4 text-purple-400" /><h3 className="font-semibold text-sm">B-Roll</h3></div>
          <textarea value={getFieldValue('brollSuggestions')} onChange={(e) => handleFieldChange('brollSuggestions', e.target.value)} className="w-full min-h-[100px] bg-muted border border-border rounded-md p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y" />
        </div>
        <div className="bg-card rounded-lg border border-border p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-2 mb-3"><Image className="h-4 w-4 text-blue-400" /><h3 className="font-semibold text-sm">Visuais</h3></div>
          <textarea value={getFieldValue('visualSuggestions')} onChange={(e) => handleFieldChange('visualSuggestions', e.target.value)} className="w-full min-h-[100px] bg-muted border border-border rounded-md p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y" />
        </div>
        <div className="bg-card rounded-lg border border-border p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-2 mb-3"><Music className="h-4 w-4 text-emerald-400" /><h3 className="font-semibold text-sm">Trilha Sonora</h3></div>
          <textarea value={getFieldValue('musicSuggestions')} onChange={(e) => handleFieldChange('musicSuggestions', e.target.value)} className="w-full min-h-[100px] bg-muted border border-border rounded-md p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y" />
        </div>
      </div>
    </div>
  );
}
