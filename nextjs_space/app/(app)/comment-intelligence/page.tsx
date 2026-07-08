'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageSquareText, Search, Loader2, AlertTriangle, Lightbulb, Heart, HelpCircle, ShieldAlert, Brain, Quote, TrendingUp, Save, FileText, Video, Globe, ChevronDown, ChevronUp, Sparkles, Download, BookOpen, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoResult {
  youtubeVideoId: string;
  title: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  subscriberCount: number;
  viralScore: number;
  thumbnailUrl: string;
  detectedNiche: string;
  engagementRate: number;
  viewsPerDay: number;
}

type AnalysisTab = 'summary' | 'pains' | 'desires' | 'questions' | 'products' | 'language';

export default function CommentIntelligencePage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // Auto-select video from URL params (coming from market-intelligence)
  useEffect(() => {
    if (!initialLoad) return;
    setInitialLoad(false);
    const videoId = searchParams?.get('videoId');
    const title = searchParams?.get('title');
    const channel = searchParams?.get('channel');
    if (videoId && title) {
      setSelectedVideo({
        youtubeVideoId: videoId,
        title: title,
        channelTitle: channel || '',
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        subscriberCount: 0,
        viralScore: 0,
        thumbnailUrl: '',
        detectedNiche: '',
        engagementRate: 0,
        viewsPerDay: 0,
      });
    }
  }, [searchParams, initialLoad]);

  // Comment fetching
  const [fetchingComments, setFetchingComments] = useState(false);
  const [commentStats, setCommentStats] = useState<any>(null);

  // Analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('summary');

  // Content generation
  const [generatingContent, setGeneratingContent] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<Record<string, any>>({});
  const [savingIdea, setSavingIdea] = useState<string | null>(null);
  const [expandedIdea, setExpandedIdea] = useState<number | null>(null);

  const searchVideos = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSelectedVideo(null);
    setAnalysis(null);
    setCommentStats(null);
    try {
      const res = await fetch('/api/market-intelligence/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), maxResults: 15 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVideos(data.videos || []);
    } catch (err: any) {
      toast.error(err.message || 'Erro na pesquisa');
    } finally {
      setSearching(false);
    }
  }, [query]);

  const fetchComments = useCallback(async (video: VideoResult) => {
    setFetchingComments(true);
    setAnalysis(null);
    setCommentStats(null);
    try {
      const res = await fetch('/api/comments/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.youtubeVideoId,
          videoTitle: video.title,
          channelTitle: video.channelTitle,
          maxComments: 300,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCommentStats(data);
      if (data.usefulCount > 0) {
        toast.success(`${data.usefulCount} comentários úteis coletados!`);
      } else {
        toast.warning('Nenhum comentário útil encontrado.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao buscar comentários');
    } finally {
      setFetchingComments(false);
    }
  }, []);

  const analyzeComments = useCallback(async () => {
    if (!selectedVideo || !commentStats) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/comments/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: selectedVideo.youtubeVideoId,
          videoTitle: selectedVideo.title,
          channelTitle: selectedVideo.channelTitle,
          niche: selectedVideo.detectedNiche,
          viewCount: selectedVideo.viewCount,
          subscriberCount: selectedVideo.subscriberCount,
          viralScore: selectedVideo.viralScore,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data.analysis);
      setAnalysisId(data.analysisId);
      setActiveTab('summary');
      toast.success('Análise de comentários concluída!');
    } catch (err: any) {
      toast.error(err.message || 'Erro na análise');
    } finally {
      setAnalyzing(false);
    }
  }, [selectedVideo, commentStats]);

  const saveIdea = useCallback(async (ideaId: string) => {
    setSavingIdea(ideaId);
    try {
      const res = await fetch('/api/infoproducts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      toast.success('Produto salvo!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingIdea(null);
    }
  }, []);

  const generateContent = useCallback(async (ideaId: string, type: string) => {
    const key = `${ideaId}-${type}`;
    setGeneratingContent(key);
    try {
      const res = await fetch('/api/infoproducts/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGeneratedContent(prev => ({ ...prev, [key]: data.result }));
      toast.success(`${type === 'offer' ? 'Oferta' : type === 'vsl' ? 'VSL' : 'Página de vendas'} gerada!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGeneratingContent(null);
    }
  }, []);

  const exportAnalysis = useCallback(() => {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comment-analysis-${selectedVideo?.youtubeVideoId || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Análise exportada!');
  }, [analysis, selectedVideo]);

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Alta Oportunidade';
    if (score >= 60) return 'Boa Oportunidade';
    if (score >= 40) return 'Moderada';
    return 'Baixa';
  };

  const tabs: { key: AnalysisTab; label: string; icon: any }[] = [
    { key: 'summary', label: 'Resumo', icon: TrendingUp },
    { key: 'pains', label: 'Dores', icon: AlertTriangle },
    { key: 'desires', label: 'Desejos', icon: Heart },
    { key: 'questions', label: 'Dúvidas', icon: HelpCircle },
    { key: 'products', label: 'Infoprodutos', icon: Lightbulb },
    { key: 'language', label: 'Linguagem', icon: Quote },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <MessageSquareText className="h-6 w-6 text-orange-400" />
          </div>
          Comment Intelligence
        </h1>
        <p className="text-muted-foreground mt-1">
          Analise comentários de vídeos virais e descubra oportunidades de infoprodutos.
        </p>
      </div>

      {/* Search */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchVideos()}
              placeholder="Pesquisar nicho ou palavra-chave..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
          <button
            onClick={searchVideos}
            disabled={searching || !query.trim()}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Pesquisar
          </button>
        </div>
      </div>

      {/* Video Selection */}
      {videos.length > 0 && !selectedVideo && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Video className="h-5 w-5 text-orange-400" />
            Selecione um vídeo para analisar comentários
          </h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {videos.map((video) => (
              <button
                key={video.youtubeVideoId}
                onClick={() => setSelectedVideo(video)}
                className="w-full text-left p-4 rounded-lg border border-border hover:border-orange-500/40 hover:bg-orange-500/5 transition-all flex gap-4 items-start"
              >
                <div className="w-32 shrink-0 aspect-video rounded-md overflow-hidden bg-muted relative">
                  {video.thumbnailUrl && (
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                  )}
                  <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-orange-600 text-white font-bold">
                    ⚡ {video.viralScore}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-2">{video.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{formatNumber(video.viewCount)} views</span>
                    <span>{formatNumber(video.commentCount)} coment.</span>
                    <span>{video.engagementRate?.toFixed(1)}% eng</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Video + Comment Actions */}
      {selectedVideo && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="w-40 shrink-0 aspect-video rounded-md overflow-hidden bg-muted">
              {selectedVideo.thumbnailUrl && (
                <img src={selectedVideo.thumbnailUrl} alt={selectedVideo.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{selectedVideo.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{selectedVideo.channelTitle}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                <span>{formatNumber(selectedVideo.viewCount)} views</span>
                <span>{formatNumber(selectedVideo.commentCount)} comentários</span>
                <span>Viral Score: {selectedVideo.viralScore}</span>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => fetchComments(selectedVideo)}
                  disabled={fetchingComments}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {fetchingComments ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareText className="h-4 w-4" />}
                  {commentStats ? 'Recarregar Comentários' : 'Coletar Comentários'}
                </button>
                <button
                  onClick={() => { setSelectedVideo(null); setCommentStats(null); setAnalysis(null); }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md transition-colors"
                >
                  Trocar vídeo
                </button>
              </div>
            </div>
          </div>

          {/* Comment Stats */}
          {commentStats && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Coletados</p>
                  <p className="text-xl font-bold text-foreground">{commentStats.totalCollected}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <p className="text-xs text-muted-foreground">Úteis</p>
                  <p className="text-xl font-bold text-emerald-400">{commentStats.usefulCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10">
                  <p className="text-xs text-muted-foreground">Spam removido</p>
                  <p className="text-xl font-bold text-red-400">{commentStats.spamRemoved}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <p className="text-xs text-muted-foreground">Fonte</p>
                  <p className="text-sm font-medium text-blue-400">{commentStats.fromCache ? 'Cache' : 'YouTube API'}</p>
                </div>
              </div>

              {commentStats.usefulCount > 0 && (
                <button
                  onClick={analyzeComments}
                  disabled={analyzing}
                  className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {analyzing ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Analisando comentários com IA...</>
                  ) : (
                    <><Brain className="h-5 w-5" /> Analisar Comentários & Gerar Infoprodutos</>
                  )}
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-1 bg-card rounded-xl border border-border p-1.5 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
            <button
              onClick={exportAnalysis}
              className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
            >
              <Download className="h-4 w-4" /> Exportar
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-card rounded-xl border border-border p-6">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

                {/* SUMMARY TAB */}
                {activeTab === 'summary' && analysis.summary && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-orange-400" /> Resumo da Análise
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground">Analisados</p>
                        <p className="text-2xl font-bold">{analysis.summary.totalAnalyzed || commentStats?.usefulCount}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground">Úteis</p>
                        <p className="text-2xl font-bold text-emerald-400">{analysis.summary.usefulComments || commentStats?.usefulCount}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground">Confiança</p>
                        <p className={`text-2xl font-bold ${analysis.summary.confidenceLevel === 'alta' ? 'text-emerald-400' : analysis.summary.confidenceLevel === 'média' ? 'text-yellow-400' : 'text-red-400'}`}>
                          {analysis.summary.confidenceLevel || 'N/A'}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground">Infoprodutos</p>
                        <p className="text-2xl font-bold text-orange-400">{analysis.infoproductIdeas?.length || 0}</p>
                      </div>
                    </div>
                    {analysis.summary.mainThemes?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Principais Temas</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.summary.mainThemes.map((t: string, i: number) => (
                            <span key={i} className="px-3 py-1 rounded-full text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.summary.confidenceReason && (
                      <p className="text-sm text-muted-foreground italic">{analysis.summary.confidenceReason}</p>
                    )}
                    {/* Market Insights */}
                    {analysis.marketInsights && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border">
                        {analysis.marketInsights.awarenessLevel && (
                          <div className="p-3 rounded-lg bg-purple-500/10">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nível de Consciência</p>
                            <p className="text-sm font-medium text-purple-400 mt-1 capitalize">{analysis.marketInsights.awarenessLevel}</p>
                          </div>
                        )}
                        {analysis.marketInsights.marketMaturity && (
                          <div className="p-3 rounded-lg bg-blue-500/10">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Maturidade</p>
                            <p className="text-sm font-medium text-blue-400 mt-1 capitalize">{analysis.marketInsights.marketMaturity}</p>
                          </div>
                        )}
                        {analysis.marketInsights.purchaseIntent && (
                          <div className="p-3 rounded-lg bg-emerald-500/10">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Intenção de Compra</p>
                            <p className="text-sm font-medium text-emerald-400 mt-1 capitalize">{analysis.marketInsights.purchaseIntent}</p>
                          </div>
                        )}
                        <div className="p-3 rounded-lg bg-amber-500/10">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Oportunidades</p>
                          <p className="text-sm font-medium text-amber-400 mt-1">{analysis.marketInsights.monetizationOpportunities?.length || 0}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PAINS TAB */}
                {activeTab === 'pains' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" /> Dores do Público
                    </h3>
                    {(analysis.pains || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma dor identificada.</p>
                    ) : (
                      <div className="space-y-3">
                        {(analysis.pains || []).map((pain: any, i: number) => (
                          <div key={i} className="p-4 rounded-lg border border-border bg-muted/50">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{pain.pain}</p>
                                <div className="flex gap-3 mt-2">
                                  <span className={`text-xs px-2 py-0.5 rounded ${pain.frequency === 'alta' ? 'bg-red-500/10 text-red-400' : pain.frequency === 'média' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                    Freq: {pain.frequency}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${pain.emotionalIntensity === 'alta' ? 'bg-red-500/10 text-red-400' : pain.emotionalIntensity === 'média' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                    Intensidade: {pain.emotionalIntensity}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">{pain.type}</span>
                                </div>
                              </div>
                            </div>
                            {pain.realPhrases?.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border/50">
                                <p className="text-xs text-muted-foreground mb-1.5">Frases reais:</p>
                                {pain.realPhrases.map((phrase: string, j: number) => (
                                  <p key={j} className="text-xs italic text-muted-foreground ml-3">"…{phrase}…"</p>
                                ))}
                              </div>
                            )}
                            {pain.productPossibility && (
                              <p className="text-xs text-emerald-400 mt-2"><Lightbulb className="h-3 w-3 inline mr-1" />{pain.productPossibility}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* DESIRES TAB */}
                {activeTab === 'desires' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Heart className="h-5 w-5 text-pink-400" /> Desejos do Público
                    </h3>
                    {(analysis.desires || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum desejo identificado.</p>
                    ) : (
                      <div className="space-y-3">
                        {(analysis.desires || []).map((desire: any, i: number) => (
                          <div key={i} className="p-4 rounded-lg border border-border bg-muted/50">
                            <p className="font-medium text-sm">{desire.desire}</p>
                            <div className="mt-2 space-y-1">
                              {desire.howItAppears && <p className="text-xs text-muted-foreground"><span className="text-pink-400">Como aparece:</span> {desire.howItAppears}</p>}
                              {desire.whatTheyWant && <p className="text-xs text-muted-foreground"><span className="text-blue-400">O que querem:</span> {desire.whatTheyWant}</p>}
                              {desire.suggestedProduct && <p className="text-xs text-emerald-400"><Lightbulb className="h-3 w-3 inline mr-1" />{desire.suggestedProduct}</p>}
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 mt-2 inline-block">{desire.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* QUESTIONS TAB */}
                {activeTab === 'questions' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-blue-400" /> Dúvidas Recorrentes
                    </h3>
                    {(analysis.recurringQuestions || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma dúvida recorrente identificada.</p>
                    ) : (
                      <div className="space-y-3">
                        {(analysis.recurringQuestions || []).map((q: any, i: number) => (
                          <div key={i} className="p-4 rounded-lg border border-border bg-muted/50">
                            <p className="font-medium text-sm">{q.question}</p>
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              {q.approximateCount && <span>~{q.approximateCount}x</span>}
                              {q.answerType && <span>Busca: {q.answerType}</span>}
                            </div>
                            {q.suggestedProduct && <p className="text-xs text-emerald-400 mt-2"><Lightbulb className="h-3 w-3 inline mr-1" />{q.suggestedProduct}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Objections */}
                    {analysis.objections?.length > 0 && (
                      <div className="pt-4 border-t border-border">
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                          <ShieldAlert className="h-4 w-4 text-yellow-400" /> Objeções
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.objections.map((o: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">{o}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Fears */}
                    {analysis.fears?.length > 0 && (
                      <div className="pt-4 border-t border-border">
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                          <ShieldAlert className="h-4 w-4 text-red-400" /> Medos
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.fears.map((f: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Limiting Beliefs */}
                    {analysis.limitingBeliefs?.length > 0 && (
                      <div className="pt-4 border-t border-border">
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                          <Brain className="h-4 w-4 text-purple-400" /> Crenças Limitantes
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.limitingBeliefs.map((b: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20">{b}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PRODUCTS TAB */}
                {activeTab === 'products' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-400" /> Ideias de Infoprodutos
                    </h3>
                    {(analysis.infoproductIdeas || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma ideia gerada.</p>
                    ) : (
                      <div className="space-y-4">
                        {(analysis.infoproductIdeas || []).map((idea: any, i: number) => {
                          const isExpanded = expandedIdea === i;
                          return (
                            <div key={i} className="rounded-xl border border-border overflow-hidden">
                              {/* Card Header */}
                              <div className="p-5 bg-muted/30">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="font-semibold">{idea.name}</h4>
                                      <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${getScoreColor(idea.opportunityScore)}`}>
                                        {idea.opportunityScore} — {getScoreLabel(idea.opportunityScore)}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                      <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">{idea.productType}</span>
                                      <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">{idea.suggestedTicket}</span>
                                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Facilidade: {idea.productionEase}/10</span>
                                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">Venda: {idea.salesPotential}/10</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">{idea.promise}</p>
                                  </div>
                                  <button
                                    onClick={() => setExpandedIdea(isExpanded ? null : i)}
                                    className="p-2 rounded-md hover:bg-muted transition-colors"
                                  >
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>

                              {/* Expanded Details */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                    <div className="p-5 border-t border-border space-y-4">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-xs text-muted-foreground">Público-alvo</p>
                                          <p className="text-sm mt-0.5">{idea.targetAudience}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Mecanismo Único</p>
                                          <p className="text-sm mt-0.5">{idea.uniqueMechanism}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Dor Principal</p>
                                          <p className="text-sm mt-0.5">{idea.mainPain}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Desejo Principal</p>
                                          <p className="text-sm mt-0.5">{idea.mainDesire}</p>
                                        </div>
                                      </div>

                                      {idea.suggestedModules?.length > 0 && (
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-2">Módulos Sugeridos</p>
                                          <div className="flex flex-wrap gap-2">
                                            {idea.suggestedModules.map((m: string, j: number) => (
                                              <span key={j} className="text-xs px-2.5 py-1 rounded-lg bg-muted border border-border">{m}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {idea.leadMagnetIdea && (
                                          <div>
                                            <p className="text-xs text-muted-foreground">Lead Magnet</p>
                                            <p className="text-sm mt-0.5">{idea.leadMagnetIdea}</p>
                                          </div>
                                        )}
                                        {idea.validationOffer && (
                                          <div>
                                            <p className="text-xs text-muted-foreground">Como Validar</p>
                                            <p className="text-sm mt-0.5">{idea.validationOffer}</p>
                                          </div>
                                        )}
                                        {idea.youtubeSalesStrategy && (
                                          <div>
                                            <p className="text-xs text-muted-foreground">Estratégia YouTube</p>
                                            <p className="text-sm mt-0.5">{idea.youtubeSalesStrategy}</p>
                                          </div>
                                        )}
                                        {idea.marketRisk && (
                                          <div>
                                            <p className="text-xs text-muted-foreground">Risco de Mercado</p>
                                            <p className="text-sm mt-0.5">{idea.marketRisk}</p>
                                          </div>
                                        )}
                                      </div>

                                      {idea.scoreReason && (
                                        <p className="text-xs text-muted-foreground italic">Ð {idea.scoreReason}</p>
                                      )}

                                      {/* Action Buttons */}
                                      <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                                        {idea._dbId && (
                                          <button
                                            onClick={() => saveIdea(idea._dbId)}
                                            disabled={savingIdea === idea._dbId}
                                            className="px-3 py-1.5 rounded-md text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                          >
                                            {savingIdea === idea._dbId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                            Salvar Produto
                                          </button>
                                        )}
                                        {idea._dbId && (
                                          <button
                                            onClick={() => generateContent(idea._dbId, 'offer')}
                                            disabled={!!generatingContent}
                                            className="px-3 py-1.5 rounded-md text-xs bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                          >
                                            {generatingContent === `${idea._dbId}-offer` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                            Gerar Oferta
                                          </button>
                                        )}
                                        {idea._dbId && (
                                          <button
                                            onClick={() => generateContent(idea._dbId, 'vsl')}
                                            disabled={!!generatingContent}
                                            className="px-3 py-1.5 rounded-md text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                          >
                                            {generatingContent === `${idea._dbId}-vsl` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Video className="h-3 w-3" />}
                                            Gerar VSL
                                          </button>
                                        )}
                                        {idea._dbId && (
                                          <button
                                            onClick={() => generateContent(idea._dbId, 'salespage')}
                                            disabled={!!generatingContent}
                                            className="px-3 py-1.5 rounded-md text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                          >
                                            {generatingContent === `${idea._dbId}-salespage` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
                                            Gerar Página de Vendas
                                          </button>
                                        )}
                                        {!idea._dbId && (
                                          <p className="text-xs text-muted-foreground italic">Reanalise os comentários para habilitar as ações.</p>
                                        )}
                                      </div>

                                      {/* Generated Content Display */}
                                      {Object.entries(generatedContent).filter(([k]) => k.startsWith(`${idea._dbId}-`)).map(([key, content]) => {
                                        const contentType = key.split('-').pop();
                                        return (
                                          <div key={key} className="mt-3 p-4 rounded-lg bg-muted border border-border">
                                            <h5 className="text-sm font-semibold mb-2 capitalize">
                                              {contentType === 'offer' ? '🎯 Oferta Gerada' : contentType === 'vsl' ? '🎥 Roteiro VSL' : '💻 Página de Vendas'}
                                            </h5>
                                            <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto">
                                              {JSON.stringify(content, null, 2)}
                                            </pre>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* LANGUAGE TAB */}
                {activeTab === 'language' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Quote className="h-5 w-5 text-cyan-400" /> Linguagem Real do Público
                    </h3>
                    <p className="text-xs text-muted-foreground">Frases anonimizadas dos comentários para usar como inspiração em copy, anúncios e páginas de venda.</p>

                    {analysis.audienceLanguage?.commonPhrases?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3">Frases Comuns</p>
                        <div className="space-y-2">
                          {analysis.audienceLanguage.commonPhrases.map((phrase: string, i: number) => (
                            <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border flex items-start gap-2">
                              <Quote className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" />
                              <p className="text-sm italic text-muted-foreground">"{phrase}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.audienceLanguage?.frequentWords?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3">Palavras Frequentes</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.audienceLanguage.frequentWords.map((word: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 rounded-full text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{word}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.audienceLanguage?.emotionalThemes?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3">Temas com Carga Emocional</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.audienceLanguage.emotionalThemes.map((theme: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 rounded-full text-xs bg-pink-500/10 text-pink-400 border border-pink-500/20">{theme}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!searching && videos.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
            <MessageSquareText className="h-8 w-8 text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold">Comment Intelligence</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Pesquise um nicho ou palavra-chave para encontrar vídeos, coletar comentários e descobrir oportunidades de infoprodutos.
          </p>
        </div>
      )}
    </div>
  );
}
