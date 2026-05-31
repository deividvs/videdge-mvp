'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Globe, Calendar, Filter, TrendingUp, ExternalLink, Bookmark,
  Loader2, AlertCircle, Eye, ThumbsUp, MessageSquare, Users, ChevronDown,
  ChevronUp, Sparkles, DollarSign, Zap, Clock, BarChart3, X
} from 'lucide-react';

interface VideoResult {
  youtubeVideoId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  viralScore: number;
  viewsPerDay: number;
  viewsSubscriberRatio: number;
  engagementRate: number;
  subscriberCount: number;
  detectedNiche: string;
  revenueConservative: number;
  revenueAverage: number;
  revenueAggressive: number;
}

const PERIODS = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '12m', label: 'Últimos 12 meses' },
];

const CATEGORIES = [
  'faceless', 'documentário', 'curiosidades', 'listas', 'educação',
  'finanças', 'tecnologia', 'saúde', 'luxo', 'crimes reais',
  'espiritualidade', 'infantil', 'outro',
];

const COUNTRIES = [
  { value: '', label: 'Todos' },
  { value: 'BR', label: 'Brasil' },
  { value: 'US', label: 'EUA' },
  { value: 'PT', label: 'Portugal' },
  { value: 'ES', label: 'Espanha' },
  { value: 'MX', label: 'México' },
  { value: 'GB', label: 'Reino Unido' },
  { value: 'DE', label: 'Alemanha' },
  { value: 'FR', label: 'França' },
  { value: 'IN', label: 'Índia' },
];

const LANGUAGES = [
  { value: '', label: 'Todos' },
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' },
  { value: 'fr', label: 'Francês' },
  { value: 'de', label: 'Alemão' },
];

function getViralBadge(score: number) {
  if (score >= 85) return { label: 'Outlier', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
  if (score >= 70) return { label: 'Alto', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  if (score >= 40) return { label: 'Moderado', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' };
  return { label: 'Baixo', bg: 'bg-zinc-500/20', text: 'text-zinc-400', border: 'border-zinc-500/30' };
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatCurrency(n: number): string {
  return `US$ ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return `${days} dias`;
  if (days < 30) return `${Math.floor(days / 7)} sem`;
  if (days < 365) return `${Math.floor(days / 30)} meses`;
  return `${Math.floor(days / 365)} anos`;
}

export default function MarketIntelligencePage() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [period, setPeriod] = useState('30d');
  const [category, setCategory] = useState('');
  const [maxResults, setMaxResults] = useState(25);
  const [minViews, setMinViews] = useState('');
  const [maxSubscribers, setMaxSubscribers] = useState('');
  const [minViralScore, setMinViralScore] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState<'viralScore' | 'viewCount' | 'viewsPerDay' | 'engagementRate'>('viralScore');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisVideo, setAnalysisVideo] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    setAnalysisResult(null);
    setAnalysisVideo(null);
    setSavedIds(new Set());

    try {
      const res = await fetch('/api/market-intelligence/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          country: country || undefined,
          language: language || undefined,
          period,
          category: category || undefined,
          maxResults,
          minViews: minViews ? Number(minViews) : undefined,
          maxSubscribers: maxSubscribers ? Number(maxSubscribers) : undefined,
          minViralScore: minViralScore ? Number(minViralScore) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na pesquisa');
      setVideos(data.videos || []);
    } catch (err: any) {
      setError(err.message);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [query, country, language, period, category, maxResults, minViews, maxSubscribers, minViralScore]);

  const saveOpportunity = useCallback(async (video: VideoResult) => {
    setSavingId(video.youtubeVideoId);
    try {
      const res = await fetch('/api/market-intelligence/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: video.detectedNiche,
          referenceVideoId: video.youtubeVideoId,
          referenceVideoTitle: video.title,
          referenceChannelTitle: video.channelTitle,
          viralScore: video.viralScore,
          estimatedRevenue: `${formatCurrency(video.revenueConservative)} - ${formatCurrency(video.revenueAggressive)}`,
          averageViews: video.viewCount,
          averageViewsPerDay: video.viewsPerDay,
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      setSavedIds(prev => new Set(prev).add(video.youtubeVideoId));
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  }, []);

  const analyzeOpportunity = useCallback(async (video: VideoResult) => {
    setAnalyzingId(video.youtubeVideoId);
    setAnalysisVideo(video.youtubeVideoId);
    setAnalysisResult(null);
    try {
      const res = await fetch('/api/market-intelligence/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: video.title,
          channelTitle: video.channelTitle,
          viewCount: video.viewCount,
          subscriberCount: video.subscriberCount,
          viralScore: video.viralScore,
          niche: video.detectedNiche,
          description: video.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na análise');
      setAnalysisResult(data.analysis);
    } catch (err: any) {
      console.error(err);
      setAnalysisResult({ error: err.message });
    } finally {
      setAnalyzingId(null);
    }
  }, []);

  const sortedVideos = [...videos].sort((a, b) => {
    switch (sortBy) {
      case 'viewCount': return b.viewCount - a.viewCount;
      case 'viewsPerDay': return b.viewsPerDay - a.viewsPerDay;
      case 'engagementRate': return b.engagementRate - a.engagementRate;
      default: return b.viralScore - a.viralScore;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <TrendingUp className="h-6 w-6 text-purple-400" />
          </div>
          Market Intelligence
        </h1>
        <p className="text-muted-foreground mt-1">
          Descubra vídeos viralizados, canais em crescimento e oportunidades de nicho no YouTube.
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Pesquisar nicho ou palavra-chave..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Pesquisar
          </button>
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          >
            {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          >
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          >
            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          >
            <option value="">Todas categorias</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <Filter className="h-3.5 w-3.5" />
          Filtros avançados
          {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Max resultados</label>
                  <input
                    type="number"
                    value={maxResults}
                    onChange={(e) => setMaxResults(Number(e.target.value))}
                    min={5}
                    max={50}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Views mínimas</label>
                  <input
                    type="number"
                    value={minViews}
                    onChange={(e) => setMinViews(e.target.value)}
                    placeholder="Ex: 10000"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Inscritos máximos</label>
                  <input
                    type="number"
                    value={maxSubscribers}
                    onChange={(e) => setMaxSubscribers(e.target.value)}
                    placeholder="Ex: 100000"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Viral Score mínimo</label>
                  <input
                    type="number"
                    value={minViralScore}
                    onChange={(e) => setMinViralScore(e.target.value)}
                    placeholder="Ex: 40"
                    min={0}
                    max={100}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Erro na pesquisa</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-purple-500/20" />
            <div className="h-12 w-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin absolute inset-0" />
          </div>
          <p className="text-muted-foreground text-sm">Analisando o YouTube...</p>
          <p className="text-xs text-muted-foreground/60">Buscando vídeos, calculando Viral Score e estimando receita</p>
        </div>
      )}

      {/* Results */}
      {!loading && searched && videos.length > 0 && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{videos.length}</span> vídeos encontrados
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Ordenar:</span>
              {[
                { key: 'viralScore' as const, label: 'Viral Score' },
                { key: 'viewCount' as const, label: 'Views' },
                { key: 'viewsPerDay' as const, label: 'Views/dia' },
                { key: 'engagementRate' as const, label: 'Engajamento' },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    sortBy === s.key
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg px-4 py-2.5">
            <p className="text-[11px] text-amber-400/80">
              ⚠️ Estimativas de faturamento são baseadas em RPMs médios de mercado e não representam valores reais. O YouTube não divulga receita real dos canais.
            </p>
          </div>

          {/* Video Cards */}
          <div className="space-y-3">
            {sortedVideos.map((video, idx) => {
              const badge = getViralBadge(video.viralScore);
              const isSaved = savedIds.has(video.youtubeVideoId);
              return (
                <motion.div
                  key={video.youtubeVideoId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-card rounded-xl border border-border hover:border-purple-500/30 transition-all overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="relative w-full sm:w-48 flex-shrink-0">
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Eye className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                        {video.duration && (
                          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                            {video.duration}
                          </span>
                        )}
                      </div>
                      <div className={`absolute top-1.5 left-1.5 ${badge.bg} ${badge.text} border ${badge.border} rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1`}>
                        <Zap className="h-2.5 w-2.5" />
                        {video.viralScore}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium line-clamp-2 leading-tight">{video.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                            <Users className="h-3 w-3" />
                            {video.channelTitle}
                            <span className="text-muted-foreground/40">·</span>
                            <Clock className="h-3 w-3" />
                            {timeAgo(video.publishedAt)}
                          </p>
                        </div>
                        <div className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full ${badge.bg} ${badge.text} border ${badge.border} text-xs font-semibold flex-shrink-0`}>
                          <Zap className="h-3 w-3" />
                          {video.viralScore} - {badge.label}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {formatNumber(video.viewCount)} views
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {formatNumber(video.likeCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {formatNumber(video.commentCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {formatNumber(Math.round(video.viewsPerDay))}/dia
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {formatNumber(video.subscriberCount)} subs
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3.5 w-3.5" />
                          {video.engagementRate.toFixed(2)}% eng
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <DollarSign className="h-3.5 w-3.5" />
                          {formatCurrency(video.revenueConservative)} - {formatCurrency(video.revenueAggressive)}/mês
                        </span>
                      </div>

                      {video.viewsSubscriberRatio > 1 && (
                        <div className="mt-2">
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5">
                            {video.viewsSubscriberRatio.toFixed(1)}x mais views que inscritos
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <a
                          href={video.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" /> Assistir
                        </a>
                        <button
                          onClick={() => saveOpportunity(video)}
                          disabled={savingId === video.youtubeVideoId || isSaved}
                          className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                            isSaved
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20'
                          }`}
                        >
                          {savingId === video.youtubeVideoId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : isSaved ? (
                            <><Bookmark className="h-3 w-3 fill-current" /> Salvo</>
                          ) : (
                            <><Bookmark className="h-3 w-3" /> Salvar</>
                          )}
                        </button>
                        <button
                          onClick={() => analyzeOpportunity(video)}
                          disabled={analyzingId === video.youtubeVideoId}
                          className="text-xs px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          {analyzingId === video.youtubeVideoId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          Analisar com IA
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  {analysisVideo === video.youtubeVideoId && (analyzingId === video.youtubeVideoId || analysisResult) && (
                    <div className="border-t border-border p-4 bg-background/50">
                      {analyzingId === video.youtubeVideoId && !analysisResult ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                          Analisando oportunidade com IA...
                        </div>
                      ) : analysisResult?.error ? (
                        <div className="text-sm text-red-400">{analysisResult.error}</div>
                      ) : analysisResult ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-purple-400" />
                              Análise de Oportunidade
                            </h4>
                            <button onClick={() => { setAnalysisResult(null); setAnalysisVideo(null); }} className="text-muted-foreground hover:text-foreground">
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {analysisResult.whyItWorked && (
                              <div className="bg-card rounded-lg p-3 border border-border">
                                <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-1">Por que funcionou</p>
                                <p className="text-xs text-muted-foreground">{analysisResult.whyItWorked}</p>
                              </div>
                            )}
                            {analysisResult.centralPromise && (
                              <div className="bg-card rounded-lg p-3 border border-border">
                                <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Promessa central</p>
                                <p className="text-xs text-muted-foreground">{analysisResult.centralPromise}</p>
                              </div>
                            )}
                            {analysisResult.emotionExplored && (
                              <div className="bg-card rounded-lg p-3 border border-border">
                                <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-1">Emoção explorada</p>
                                <p className="text-xs text-muted-foreground">{analysisResult.emotionExplored}</p>
                              </div>
                            )}
                            {analysisResult.targetAudience && (
                              <div className="bg-card rounded-lg p-3 border border-border">
                                <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Público-alvo</p>
                                <p className="text-xs text-muted-foreground">{analysisResult.targetAudience}</p>
                              </div>
                            )}
                            {analysisResult.sustainability && (
                              <div className="bg-card rounded-lg p-3 border border-border">
                                <p className="text-[10px] text-cyan-400 uppercase tracking-wider mb-1">Sustentabilidade</p>
                                <p className="text-xs text-muted-foreground">{analysisResult.sustainability}</p>
                              </div>
                            )}
                            {analysisResult.originalApproach && (
                              <div className="bg-card rounded-lg p-3 border border-border">
                                <p className="text-[10px] text-pink-400 uppercase tracking-wider mb-1">Abordagem original</p>
                                <p className="text-xs text-muted-foreground">{analysisResult.originalApproach}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {analysisResult.competitionLevel && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border">
                                Concorrência: {analysisResult.competitionLevel}
                              </span>
                            )}
                            {analysisResult.opportunityLevel && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                Oportunidade: {analysisResult.opportunityLevel}
                              </span>
                            )}
                            {analysisResult.monetizationPotential && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                Monetização: {analysisResult.monetizationPotential}
                              </span>
                            )}
                          </div>

                          {analysisResult.derivedIdeas?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium mb-2">Ideias derivadas:</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {analysisResult.derivedIdeas.map((idea: string, i: number) => (
                                  <div key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                    <span className="text-purple-400 font-mono text-[10px] mt-0.5">{i + 1}.</span>
                                    {idea}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {analysisResult.suggestedTitles?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium mb-2">Títulos sugeridos:</p>
                              <div className="space-y-1">
                                {analysisResult.suggestedTitles.map((title: string, i: number) => (
                                  <div key={i} className="text-xs text-muted-foreground bg-card rounded px-2.5 py-1.5 border border-border">
                                    {title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {analysisResult.risks && (
                            <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                              <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Riscos</p>
                              <p className="text-xs text-muted-foreground">{analysisResult.risks}</p>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && searched && videos.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Nenhum resultado encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">Tente usar palavras-chave diferentes ou ajustar os filtros.</p>
        </div>
      )}

      {/* Initial State */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
            <TrendingUp className="h-10 w-10 text-purple-400" />
          </div>
          <h3 className="text-lg font-medium">Descubra oportunidades no YouTube</h3>
          <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
            Pesquise por nichos ou palavras-chave para encontrar vídeos viralizados, canais em crescimento e oportunidades de mercado.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['histórias bíblicas', 'finanças pessoais', 'true crime', 'curiosidades ciência', 'luxo lifestyle'].map(s => (
              <button
                key={s}
                onClick={() => { setQuery(s); }}
                className="text-xs px-3 py-1.5 rounded-full bg-card border border-border hover:border-purple-500/30 hover:text-purple-400 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-8 max-w-lg text-center">
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
              ⚠️ Estimativas de faturamento são baseadas em RPMs médios de mercado e não representam valores reais.
              O YouTube não divulga receita real dos canais. Valores servem apenas como referência para análise de potencial.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
