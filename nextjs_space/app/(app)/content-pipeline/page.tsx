'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb, BarChart3, Image, FileText, TrendingUp, Loader2, AlertCircle,
  ChevronRight, ChevronDown, CheckCircle, Zap, Sparkles, ArrowRight, ArrowLeft,
  Play, Search, Globe, Users, Target, Clock, Mic, Palette, BookOpen,
  Copy, RotateCcw
} from 'lucide-react';

// ============ Types ============
interface PipelineSession {
  id: string;
  niche: string;
  country?: string;
  language?: string;
  audience?: string;
  channelType?: string;
  channelGoal?: string;
  videoDuration?: string;
  contentTone?: string;
  currentStage: number;
  youtubeData?: string;
  stage1Result?: string;
  stage2Result?: string;
  stage3Result?: string;
  stage4Result?: string;
  stage5Result?: string;
  selectedIdeaIdx?: number;
}

const STAGES = [
  { num: 1, label: 'Ideias Virais', icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { num: 2, label: 'Padrões de Sucesso', icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { num: 3, label: 'Thumbnails', icon: Image, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  { num: 4, label: 'Roteiro', icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { num: 5, label: 'Plano de Crescimento', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
];

const CHANNEL_TYPES = ['faceless', 'pessoal', 'institucional', 'outro'];
const CHANNEL_GOALS = ['AdSense', 'afiliados', 'venda de produto', 'autoridade', 'comunidade', 'leads'];
const DURATIONS = ['5 minutos', '8 minutos', '10 minutos', '15 minutos', '20 minutos'];
const TONES = ['curioso', 'educativo', 'dramático', 'investigativo', 'polêmico', 'inspirador', 'documental', 'direto'];
const EMOTIONS = ['curiosidade', 'medo', 'desejo', 'urgência', 'surpresa', 'autoridade', 'polêmica'];
const STYLES = ['documentário', 'dark', 'luxury', 'minimalista', 'notícia', 'YouTube viral'];
const CHANNEL_LEVELS = ['novo', 'iniciante', 'intermediário', 'avançado'];

// ============ Helpers ============
function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// ============ Component ============
export default function ContentPipelinePage() {
  // Setup state
  const [step, setStep] = useState<'setup' | 'pipeline'>('setup');
  const [pSession, setPSession] = useState<PipelineSession | null>(null);
  const [activeStage, setActiveStage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ytLoading, setYtLoading] = useState(false);

  // Setup form
  const [niche, setNiche] = useState('');
  const [country, setCountry] = useState('BR');
  const [language, setLanguage] = useState('pt');
  const [audience, setAudience] = useState('');
  const [channelType, setChannelType] = useState('faceless');
  const [channelGoal, setChannelGoal] = useState('AdSense');
  const [videoDuration, setVideoDuration] = useState('10 minutos');
  const [contentTone, setContentTone] = useState('curioso');

  // Stage 3 extra params
  const [s3Emotion, setS3Emotion] = useState('curiosidade');
  const [s3Style, setS3Style] = useState('YouTube viral');

  // Stage 4 extra params
  const [s4Cta, setS4Cta] = useState('Inscreva-se e ative as notificações');

  // Stage 5 extra params
  const [s5Level, setS5Level] = useState('novo');
  const [s5Freq, setS5Freq] = useState('3x por semana');

  // Parsed stage results
  const [stage1, setStage1] = useState<any>(null);
  const [stage2, setStage2] = useState<any>(null);
  const [stage3, setStage3] = useState<any>(null);
  const [stage4, setStage4] = useState<any>(null);
  const [stage5, setStage5] = useState<any>(null);
  const [selectedIdea, setSelectedIdea] = useState<number | null>(null);

  // Load existing sessions on mount
  const [existingSessions, setExistingSessions] = useState<PipelineSession[]>([]);
  useEffect(() => {
    fetch('/api/pipeline').then(r => r.json()).then(d => {
      setExistingSessions(d.sessions || []);
    }).catch(() => {});
  }, []);

  // Restore a session
  const restoreSession = useCallback((s: PipelineSession) => {
    setPSession(s);
    setNiche(s.niche);
    setCountry(s.country || 'BR');
    setLanguage(s.language || 'pt');
    setAudience(s.audience || '');
    setChannelType(s.channelType || 'faceless');
    setChannelGoal(s.channelGoal || 'AdSense');
    setVideoDuration(s.videoDuration || '10 minutos');
    setContentTone(s.contentTone || 'curioso');
    try { if (s.stage1Result) setStage1(JSON.parse(s.stage1Result)); } catch {}
    try { if (s.stage2Result) setStage2(JSON.parse(s.stage2Result)); } catch {}
    try { if (s.stage3Result) setStage3(JSON.parse(s.stage3Result)); } catch {}
    try { if (s.stage4Result) setStage4(JSON.parse(s.stage4Result)); } catch {}
    try { if (s.stage5Result) setStage5(JSON.parse(s.stage5Result)); } catch {}
    if (s.selectedIdeaIdx != null) setSelectedIdea(s.selectedIdeaIdx);
    setActiveStage(s.currentStage);
    setStep('pipeline');
  }, []);

  // Create session & fetch YouTube data
  const startPipeline = useCallback(async () => {
    if (!niche.trim()) return;
    setLoading(true);
    setError('');

    try {
      // 1. Create pipeline session
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, country, language, audience, channelType, channelGoal, videoDuration, contentTone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newSession = data.session;
      setPSession(newSession);

      // 2. Fetch YouTube data in background
      setStep('pipeline');
      setYtLoading(true);

      try {
        const ytRes = await fetch('/api/market-intelligence/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: niche,
            country: country || undefined,
            language: language || undefined,
            period: '30d',
            maxResults: 25,
          }),
        });
        const ytData = await ytRes.json();
        if (ytRes.ok && ytData.videos?.length > 0) {
          const ytPayload = { videos: ytData.videos };
          await fetch(`/api/pipeline/${newSession.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ youtubeData: JSON.stringify(ytPayload) }),
          });
          newSession.youtubeData = JSON.stringify(ytPayload);
          setPSession({ ...newSession });
        }
      } catch (err) {
        console.error('YouTube data fetch failed:', err);
      } finally {
        setYtLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [niche, country, language, audience, channelType, channelGoal, videoDuration, contentTone]);

  // Generate a stage
  const generateStage = useCallback(async (stageNum: number) => {
    if (!pSession) return;
    setLoading(true);
    setError('');

    const extraParams: any = {};
    if (stageNum === 3) {
      const ideaTitle = selectedIdea != null && stage1?.ideas?.[selectedIdea]
        ? stage1.ideas[selectedIdea].title
        : niche;
      extraParams.videoTitle = ideaTitle;
      extraParams.emotion = s3Emotion;
      extraParams.style = s3Style;
    }
    if (stageNum === 4) {
      const ideaTitle = selectedIdea != null && stage1?.ideas?.[selectedIdea]
        ? stage1.ideas[selectedIdea].title
        : niche;
      extraParams.videoTitle = ideaTitle;
      extraParams.cta = s4Cta;
    }
    if (stageNum === 5) {
      extraParams.channelLevel = s5Level;
      extraParams.postingFrequency = s5Freq;
    }

    try {
      const res = await fetch('/api/pipeline/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: pSession.id, stage: stageNum, extraParams }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      switch (stageNum) {
        case 1: setStage1(data.result); break;
        case 2: setStage2(data.result); break;
        case 3: setStage3(data.result); break;
        case 4: setStage4(data.result); break;
        case 5: setStage5(data.result); break;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pSession, selectedIdea, stage1, niche, s3Emotion, s3Style, s4Cta, s5Level, s5Freq]);

  // Select idea and save
  const selectIdea = useCallback(async (idx: number) => {
    setSelectedIdea(idx);
    if (pSession) {
      await fetch(`/api/pipeline/${pSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedIdeaIdx: idx }),
      }).catch(() => {});
    }
  }, [pSession]);

  const selectedTitle = selectedIdea != null && stage1?.ideas?.[selectedIdea]
    ? stage1.ideas[selectedIdea].title : '';

  // ============ RENDER: Setup ============
  if (step === 'setup') {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Zap className="h-6 w-6 text-purple-400" />
            </div>
            Esteira de Conteúdo
          </h1>
          <p className="text-muted-foreground mt-1">
            5 etapas estratégicas para criar conteúdo viral — da ideia ao plano de crescimento.
          </p>
        </div>

        {/* Existing sessions */}
        {existingSessions.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              Continuar sessão anterior
            </h3>
            <div className="space-y-2">
              {existingSessions.slice(0, 5).map(s => (
                <button
                  key={s.id}
                  onClick={() => restoreSession(s)}
                  className="w-full text-left flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-purple-500/30 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium">{s.niche}</span>
                    <span className="text-xs text-muted-foreground ml-2">Etapa {s.currentStage}/5</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Setup Form */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-5">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Play className="h-4 w-4 text-purple-400" />
            Nova esteira de conteúdo
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1.5 block">Nicho *</label>
              <input type="text" value={niche} onChange={e => setNiche(e.target.value)} placeholder="Ex: histórias bíblicas, finanças pessoais, true crime..." className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">País alvo</label>
              <select value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40">
                <option value="BR">Brasil</option><option value="US">EUA</option><option value="PT">Portugal</option><option value="ES">Espanha</option><option value="">Global</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Idioma</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40">
                <option value="pt">Português</option><option value="en">Inglês</option><option value="es">Espanhol</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1.5 block">Público-alvo</label>
              <input type="text" value={audience} onChange={e => setAudience(e.target.value)} placeholder="Ex: homens 25-45 interessados em investimentos" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Tipo de canal</label>
              <select value={channelType} onChange={e => setChannelType(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40">
                {CHANNEL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Objetivo do canal</label>
              <select value={channelGoal} onChange={e => setChannelGoal(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40">
                {CHANNEL_GOALS.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Duração dos vídeos</label>
              <select value={videoDuration} onChange={e => setVideoDuration(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40">
                {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Tom do conteúdo</label>
              <select value={contentTone} onChange={e => setContentTone(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40">
                {TONES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={startPipeline}
            disabled={loading || !niche.trim()}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Iniciar Esteira de Conteúdo
          </button>
        </div>

        {/* Pipeline visual */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-medium mb-4">Como funciona</h3>
          <div className="space-y-3">
            {STAGES.map((s, i) => (
              <div key={s.num} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${s.bg} border ${s.border} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <span className="text-sm font-medium">Etapa {s.num}: {s.label}</span>
                </div>
                {i < STAGES.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/30 ml-auto" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============ RENDER: Pipeline ============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-400" />
            Esteira: <span className="text-purple-400">{niche}</span>
          </h1>
          {ytLoading && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Coletando dados do YouTube...
            </p>
          )}
          {pSession?.youtubeData && !ytLoading && (
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle className="h-3 w-3" /> Dados do YouTube carregados
            </p>
          )}
        </div>
        <button onClick={() => { setStep('setup'); setPSession(null); setStage1(null); setStage2(null); setStage3(null); setStage4(null); setStage5(null); setSelectedIdea(null); }} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors">
          Nova esteira
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STAGES.map((s) => {
          const isActive = activeStage === s.num;
          const isCompleted = s.num === 1 ? !!stage1 : s.num === 2 ? !!stage2 : s.num === 3 ? !!stage3 : s.num === 4 ? !!stage4 : !!stage5;
          return (
            <button
              key={s.num}
              onClick={() => setActiveStage(s.num)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? `${s.bg} ${s.color} border ${s.border}`
                  : isCompleted
                    ? 'bg-muted text-foreground border border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {isCompleted && !isActive ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <s.icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.num}</span>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* ============ STAGE 1: Viral Ideas ============ */}
      {activeStage === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              Etapa 1 — Ideias de Vídeos Virais
            </h2>
            <button onClick={() => generateStage(1)} disabled={loading} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {stage1 ? 'Regenerar' : 'Gerar'} Ideias
            </button>
          </div>

          {!stage1 && !loading && (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Lightbulb className="h-10 w-10 text-amber-400/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Clique em "Gerar Ideias" para a IA criar 10 ideias de vídeos virais baseadas no nicho <strong>{niche}</strong>.</p>
              {pSession?.youtubeData && <p className="text-xs text-emerald-400 mt-2">Dados do YouTube serão usados como base.</p>}
            </div>
          )}

          {loading && activeStage === 1 && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
              <p className="text-sm text-muted-foreground">Gerando ideias virais com IA...</p>
            </div>
          )}

          {stage1?.ideas && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Selecione uma ideia para avançar nas próximas etapas:</p>
              {stage1.ideas.map((idea: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => selectIdea(idx)}
                  className={`bg-card rounded-xl border p-4 cursor-pointer transition-all ${
                    selectedIdea === idx ? 'border-amber-500/50 bg-amber-500/5' : 'border-border hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {selectedIdea === idx && <CheckCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />}
                        <h3 className="text-sm font-medium">{idea.title}</h3>
                      </div>
                      {idea.titleVariations?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {idea.titleVariations.map((v: string, vi: number) => (
                            <span key={vi} className="text-[10px] bg-muted px-2 py-0.5 rounded">{v}</span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">{idea.angle || idea.promise}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5">Viral: {idea.viralPotential}/10</span>
                      <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">Dific: {idea.productionDifficulty}/10</span>
                      {idea.risk && <span className={`text-[10px] px-2 py-0.5 rounded-full ${idea.risk === 'alto' ? 'bg-red-500/10 text-red-400' : idea.risk === 'médio' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>Risco: {idea.risk}</span>}
                    </div>
                  </div>
                  {idea.whyViral && <p className="text-[11px] text-muted-foreground mt-2 border-t border-border pt-2"><strong className="text-foreground">Por que pode viralizar:</strong> {idea.whyViral}</p>}
                  {idea.patternObserved && <p className="text-[11px] text-purple-400/80 mt-1"><strong>Padrão observado:</strong> {idea.patternObserved}</p>}
                  {idea.originalityTip && <p className="text-[11px] text-emerald-400/80 mt-1"><strong>Como deixar original:</strong> {idea.originalityTip}</p>}
                </motion.div>
              ))}
              {selectedIdea != null && (
                <button onClick={() => setActiveStage(2)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  Avançar para Análise de Padrões <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============ STAGE 2: Pattern Analysis ============ */}
      {activeStage === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              Etapa 2 — Padrões de Sucesso
            </h2>
            <button onClick={() => generateStage(2)} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {stage2 ? 'Regenerar' : 'Analisar'} Padrões
            </button>
          </div>

          {!stage2 && !loading && (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <BarChart3 className="h-10 w-10 text-blue-400/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">A IA vai analisar os vídeos do YouTube e identificar padrões de sucesso no nicho.</p>
            </div>
          )}

          {loading && activeStage === 2 && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <p className="text-sm text-muted-foreground">Analisando padrões de sucesso...</p>
            </div>
          )}

          {stage2 && !loading && (
            <div className="space-y-4">
              {stage2.generalDiagnosis && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="text-xs text-blue-400 uppercase tracking-wider mb-2">Diagnóstico Geral</h3>
                  <p className="text-sm text-muted-foreground">{stage2.generalDiagnosis}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stage2.titlePatterns?.length > 0 && (
                  <div className="bg-card rounded-xl border border-border p-4">
                    <h3 className="text-xs text-amber-400 uppercase tracking-wider mb-2">Padrões de Título</h3>
                    <ul className="space-y-1">{stage2.titlePatterns.map((p: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-amber-400 mt-0.5">•</span>{p}</li>)}</ul>
                  </div>
                )}
                {stage2.thumbnailPatterns?.length > 0 && (
                  <div className="bg-card rounded-xl border border-border p-4">
                    <h3 className="text-xs text-pink-400 uppercase tracking-wider mb-2">Padrões de Thumbnail</h3>
                    <ul className="space-y-1">{stage2.thumbnailPatterns.map((p: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-pink-400 mt-0.5">•</span>{p}</li>)}</ul>
                  </div>
                )}
                {stage2.themePatterns?.length > 0 && (
                  <div className="bg-card rounded-xl border border-border p-4">
                    <h3 className="text-xs text-purple-400 uppercase tracking-wider mb-2">Padrões de Tema</h3>
                    <ul className="space-y-1">{stage2.themePatterns.map((p: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-purple-400 mt-0.5">•</span>{p}</li>)}</ul>
                  </div>
                )}
                {stage2.retentionPatterns?.length > 0 && (
                  <div className="bg-card rounded-xl border border-border p-4">
                    <h3 className="text-xs text-emerald-400 uppercase tracking-wider mb-2">Padrões de Retenção</h3>
                    <ul className="space-y-1">{stage2.retentionPatterns.map((p: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">•</span>{p}</li>)}</ul>
                  </div>
                )}
              </div>

              {stage2.opportunities?.length > 0 && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                  <h3 className="text-xs text-emerald-400 uppercase tracking-wider mb-2">Oportunidades Encontradas</h3>
                  <ul className="space-y-1">{stage2.opportunities.map((o: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">{i + 1}.</span>{o}</li>)}</ul>
                </div>
              )}

              {stage2.risks?.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                  <h3 className="text-xs text-red-400 uppercase tracking-wider mb-2">Riscos</h3>
                  <ul className="space-y-1">{stage2.risks.map((r: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-red-400 mt-0.5">⚠</span>{r}</li>)}</ul>
                </div>
              )}

              {stage2.recommendations?.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="text-xs text-blue-400 uppercase tracking-wider mb-2">Recomendações Finais</h3>
                  <ul className="space-y-1">{stage2.recommendations.map((r: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-blue-400 mt-0.5">✓</span>{r}</li>)}</ul>
                </div>
              )}

              <button onClick={() => setActiveStage(3)} className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                Avançar para Thumbnails <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============ STAGE 3: Thumbnails ============ */}
      {activeStage === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Image className="h-5 w-5 text-pink-400" />
              Etapa 3 — Conceitos de Thumbnail
            </h2>
            <button onClick={() => generateStage(3)} disabled={loading} className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {stage3 ? 'Regenerar' : 'Gerar'} Thumbnails
            </button>
          </div>

          {selectedTitle && <p className="text-xs text-muted-foreground">Vídeo selecionado: <strong className="text-foreground">"{selectedTitle}"</strong></p>}

          {/* Extra params for stage 3 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Emoção desejada</label>
              <select value={s3Emotion} onChange={e => setS3Emotion(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40">
                {EMOTIONS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Estilo visual</label>
              <select value={s3Style} onChange={e => setS3Style(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40">
                {STYLES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {!stage3 && !loading && (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Image className="h-10 w-10 text-pink-400/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Gere 5 conceitos de thumbnail com prompts para geração de imagem por IA.</p>
            </div>
          )}

          {loading && activeStage === 3 && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-pink-400" />
              <p className="text-sm text-muted-foreground">Criando conceitos de thumbnail...</p>
            </div>
          )}

          {stage3?.concepts && (
            <div className="space-y-4">
              {stage3.concepts.map((c: any, idx: number) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }} className="bg-card rounded-xl border border-border p-4">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Palette className="h-4 w-4 text-pink-400" />
                    Thumbnail {idx + 1} — {c.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div className="space-y-2">
                      {c.visualIdea && <div><p className="text-[10px] text-pink-400 uppercase">Ideia Visual</p><p className="text-xs text-muted-foreground">{c.visualIdea}</p></div>}
                      {c.thumbnailText && <div><p className="text-[10px] text-amber-400 uppercase">Texto</p><p className="text-sm font-bold">"{c.thumbnailText}"</p></div>}
                      {c.emotion && <div><p className="text-[10px] text-purple-400 uppercase">Emoção</p><p className="text-xs text-muted-foreground">{c.emotion}</p></div>}
                      {c.composition && <div><p className="text-[10px] text-blue-400 uppercase">Composição</p><p className="text-xs text-muted-foreground">{c.composition}</p></div>}
                    </div>
                    <div className="space-y-2">
                      {c.suggestedColors && <div><p className="text-[10px] text-emerald-400 uppercase">Cores</p><p className="text-xs text-muted-foreground">{c.suggestedColors}</p></div>}
                      {c.clickReason && <div><p className="text-[10px] text-amber-400 uppercase">Por que gera clique</p><p className="text-xs text-muted-foreground">{c.clickReason}</p></div>}
                      {c.risk && <div><p className="text-[10px] text-red-400 uppercase">Risco</p><p className="text-xs text-muted-foreground">{c.risk}</p></div>}
                      {c.abTestSuggestion && <div><p className="text-[10px] text-cyan-400 uppercase">Teste A/B</p><p className="text-xs text-muted-foreground">{c.abTestSuggestion}</p></div>}
                    </div>
                  </div>
                  {c.aiImagePrompt && (
                    <div className="mt-3 bg-background rounded-lg p-3 border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-purple-400 uppercase">Prompt para IA</p>
                        <button onClick={() => copyText(c.aiImagePrompt)} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"><Copy className="h-3 w-3" />Copiar</button>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{c.aiImagePrompt}</p>
                    </div>
                  )}
                </motion.div>
              ))}
              <button onClick={() => setActiveStage(4)} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                Avançar para Roteiro <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============ STAGE 4: Script ============ */}
      {activeStage === 4 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              Etapa 4 — Roteiro Otimizado
            </h2>
            <button onClick={() => generateStage(4)} disabled={loading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {stage4 ? 'Regenerar' : 'Gerar'} Roteiro
            </button>
          </div>

          {selectedTitle && <p className="text-xs text-muted-foreground">Vídeo: <strong className="text-foreground">"{selectedTitle}"</strong></p>}

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">CTA desejado</label>
            <input type="text" value={s4Cta} onChange={e => setS4Cta(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
          </div>

          {!stage4 && !loading && (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <FileText className="h-10 w-10 text-emerald-400/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Gere um roteiro completo otimizado para retenção.</p>
            </div>
          )}

          {loading && activeStage === 4 && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              <p className="text-sm text-muted-foreground">Escrevendo roteiro otimizado...</p>
            </div>
          )}

          {stage4 && !loading && (
            <div className="space-y-4">
              {stage4.title && <h3 className="text-lg font-bold">{stage4.title}</h3>}
              {stage4.centralPromise && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                  <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Promessa Central</p>
                  <p className="text-sm">{stage4.centralPromise}</p>
                </div>
              )}

              {/* Hook */}
              {stage4.hook && (
                <div className="bg-card rounded-xl border border-amber-500/20 p-4">
                  <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-1">Gancho Inicial — 0:00 a 0:15</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{stage4.hook}</p>
                </div>
              )}

              {/* Introduction */}
              {stage4.introduction && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Introdução Rápida — 0:15 a 0:45</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{stage4.introduction}</p>
                </div>
              )}

              {/* Blocks */}
              {stage4.blocks?.map((block: any, idx: number) => (
                <div key={idx} className="bg-card rounded-xl border border-border p-4 space-y-3">
                  <h4 className="text-sm font-medium">Bloco {idx + 1} — {block.name}</h4>
                  <div><p className="text-[10px] text-foreground uppercase mb-0.5">Narração</p><p className="text-xs text-muted-foreground whitespace-pre-wrap">{block.narration}</p></div>
                  {block.visualBroll && <div><p className="text-[10px] text-pink-400 uppercase mb-0.5">Visual / B-Roll</p><p className="text-xs text-muted-foreground">{block.visualBroll}</p></div>}
                  {block.retentionGoal && <div><p className="text-[10px] text-emerald-400 uppercase mb-0.5">Objetivo de Retenção</p><p className="text-xs text-muted-foreground">{block.retentionGoal}</p></div>}
                  {block.transition && <div><p className="text-[10px] text-purple-400 uppercase mb-0.5">Transição</p><p className="text-xs text-muted-foreground">{block.transition}</p></div>}
                </div>
              ))}

              {/* Conclusion & CTA */}
              {stage4.conclusion && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Conclusão</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{stage4.conclusion}</p>
                </div>
              )}
              {stage4.cta && (
                <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4">
                  <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-1">CTA Final</p>
                  <p className="text-sm">{stage4.cta}</p>
                </div>
              )}

              {/* Editing Notes */}
              {stage4.editingNotes && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <h4 className="text-xs text-muted-foreground uppercase mb-3">Observações de Edição</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {stage4.editingNotes.rhythm && <div><p className="text-[10px] text-amber-400 uppercase">Ritmo</p><p className="text-xs text-muted-foreground">{stage4.editingNotes.rhythm}</p></div>}
                    {stage4.editingNotes.music && <div><p className="text-[10px] text-pink-400 uppercase">Trilhas</p><p className="text-xs text-muted-foreground">{stage4.editingNotes.music}</p></div>}
                    {stage4.editingNotes.cuts && <div><p className="text-[10px] text-blue-400 uppercase">Cortes</p><p className="text-xs text-muted-foreground">{stage4.editingNotes.cuts}</p></div>}
                    {stage4.editingNotes.patternBreaks && <div><p className="text-[10px] text-purple-400 uppercase">Quebras de Padrão</p><p className="text-xs text-muted-foreground">{stage4.editingNotes.patternBreaks}</p></div>}
                  </div>
                </div>
              )}

              {stage4.estimatedDuration && <p className="text-xs text-muted-foreground">Duração estimada: <strong>{stage4.estimatedDuration}</strong></p>}

              <button onClick={() => setActiveStage(5)} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                Avançar para Plano de Crescimento <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============ STAGE 5: Growth Plan ============ */}
      {activeStage === 5 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Etapa 5 — Plano de Crescimento
            </h2>
            <button onClick={() => generateStage(5)} disabled={loading} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {stage5 ? 'Regenerar' : 'Gerar'} Plano
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nível do canal</label>
              <select value={s5Level} onChange={e => setS5Level(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40">
                {CHANNEL_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Frequência de postagem</label>
              <select value={s5Freq} onChange={e => setS5Freq(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40">
                <option value="1x por semana">1x por semana</option>
                <option value="2x por semana">2x por semana</option>
                <option value="3x por semana">3x por semana</option>
                <option value="diário">Diário</option>
              </select>
            </div>
          </div>

          {!stage5 && !loading && (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <TrendingUp className="h-10 w-10 text-purple-400/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Gere um plano estratégico de crescimento com metas de 30, 60 e 90 dias.</p>
            </div>
          )}

          {loading && activeStage === 5 && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              <p className="text-sm text-muted-foreground">Criando plano de crescimento...</p>
            </div>
          )}

          {stage5 && !loading && (
            <div className="space-y-4">
              {stage5.nicheDiagnosis && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="text-xs text-purple-400 uppercase tracking-wider mb-2">Diagnóstico do Nicho</h3>
                  <p className="text-sm text-muted-foreground">{stage5.nicheDiagnosis}</p>
                </div>
              )}

              {stage5.positioning && (
                <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4">
                  <h3 className="text-xs text-purple-400 uppercase tracking-wider mb-2">Posicionamento Recomendado</h3>
                  <p className="text-sm text-muted-foreground">{stage5.positioning}</p>
                </div>
              )}

              {stage5.contentPillars?.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="text-xs text-amber-400 uppercase tracking-wider mb-2">Pilares de Conteúdo</h3>
                  <div className="space-y-1">{stage5.contentPillars.map((p: string, i: number) => <div key={i} className="text-xs text-muted-foreground flex items-start gap-2"><span className="text-amber-400 font-bold">{i + 1}.</span>{p}</div>)}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stage5.contentStrategy && <div className="bg-card rounded-xl border border-border p-4"><h3 className="text-xs text-blue-400 uppercase tracking-wider mb-2">Estratégia de Conteúdo</h3><p className="text-xs text-muted-foreground">{stage5.contentStrategy}</p></div>}
                {stage5.retentionStrategy && <div className="bg-card rounded-xl border border-border p-4"><h3 className="text-xs text-emerald-400 uppercase tracking-wider mb-2">Estratégia de Retenção</h3><p className="text-xs text-muted-foreground">{stage5.retentionStrategy}</p></div>}
                {stage5.ctrStrategy && <div className="bg-card rounded-xl border border-border p-4"><h3 className="text-xs text-pink-400 uppercase tracking-wider mb-2">Estratégia de CTR</h3><p className="text-xs text-muted-foreground">{stage5.ctrStrategy}</p></div>}
                {stage5.monetizationStrategy && <div className="bg-card rounded-xl border border-border p-4"><h3 className="text-xs text-amber-400 uppercase tracking-wider mb-2">Monetização</h3><p className="text-xs text-muted-foreground">{stage5.monetizationStrategy}</p></div>}
              </div>

              {/* 30/60/90 days */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {stage5.plan30Days && (
                  <div className="bg-card rounded-xl border border-emerald-500/20 p-4">
                    <h3 className="text-xs text-emerald-400 uppercase tracking-wider mb-2">Plano 30 Dias</h3>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{stage5.plan30Days}</p>
                  </div>
                )}
                {stage5.plan60Days && (
                  <div className="bg-card rounded-xl border border-blue-500/20 p-4">
                    <h3 className="text-xs text-blue-400 uppercase tracking-wider mb-2">Plano 60 Dias</h3>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{stage5.plan60Days}</p>
                  </div>
                )}
                {stage5.plan90Days && (
                  <div className="bg-card rounded-xl border border-purple-500/20 p-4">
                    <h3 className="text-xs text-purple-400 uppercase tracking-wider mb-2">Plano 90 Dias</h3>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{stage5.plan90Days}</p>
                  </div>
                )}
              </div>

              {stage5.keyMetrics?.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="text-xs text-blue-400 uppercase tracking-wider mb-2">Métricas Principais</h3>
                  <div className="flex flex-wrap gap-2">{stage5.keyMetrics.map((m: string, i: number) => <span key={i} className="text-xs bg-muted px-2 py-1 rounded">{m}</span>)}</div>
                </div>
              )}

              {stage5.decisions && (
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
                  <h3 className="text-xs text-amber-400 uppercase tracking-wider mb-2">Decisões Estratégicas</h3>
                  <p className="text-xs text-muted-foreground">{stage5.decisions}</p>
                </div>
              )}

              {stage5.risks?.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                  <h3 className="text-xs text-red-400 uppercase tracking-wider mb-2">Riscos</h3>
                  <ul className="space-y-1">{stage5.risks.map((r: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-red-400 mt-0.5">⚠</span>{r}</li>)}</ul>
                </div>
              )}

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <h3 className="text-sm font-medium">Esteira completa!</h3>
                <p className="text-xs text-muted-foreground mt-1">Você completou todas as 5 etapas estratégicas para o nicho <strong>{niche}</strong>.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation arrows */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={() => setActiveStage(Math.max(1, activeStage - 1))}
          disabled={activeStage === 1}
          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Etapa anterior
        </button>
        <div className="text-xs text-muted-foreground">
          Etapa {activeStage} de 5
        </div>
        <button
          onClick={() => setActiveStage(Math.min(5, activeStage + 1))}
          disabled={activeStage === 5}
          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-1 transition-colors"
        >
          Próxima etapa <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
