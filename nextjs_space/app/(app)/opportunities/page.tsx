'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark, Loader2, AlertCircle, Trash2, Sparkles, ExternalLink,
  ChevronDown, ChevronRight, Zap, TrendingUp, Eye, DollarSign,
  CheckCircle, Clock, XCircle, Search as SearchIcon
} from 'lucide-react';

interface Opportunity {
  id: string;
  niche: string;
  subniche: string | null;
  description: string | null;
  referenceVideoId: string | null;
  referenceVideoTitle: string | null;
  referenceChannelTitle: string | null;
  viralScore: number | null;
  estimatedRevenue: string | null;
  averageViews: number | null;
  averageViewsPerDay: number | null;
  competitionLevel: string | null;
  opportunityLevel: string | null;
  monetizationPotential: string | null;
  productionDifficulty: string | null;
  aiAnalysis: string | null;
  suggestedAngle: string | null;
  risks: string | null;
  derivedIdeas: string | null;
  status: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  'nova': { label: 'Nova', icon: Clock, color: 'text-blue-400' },
  'em análise': { label: 'Em Análise', icon: SearchIcon, color: 'text-purple-400' },
  'escolhida': { label: 'Escolhida', icon: CheckCircle, color: 'text-emerald-400' },
  'descartada': { label: 'Descartada', icon: XCircle, color: 'text-zinc-400' },
};

function getViralBadge(score: number) {
  if (score >= 85) return { label: 'Outlier', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
  if (score >= 70) return { label: 'Alto', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  if (score >= 40) return { label: 'Moderado', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' };
  return { label: 'Baixo', bg: 'bg-zinc-500/20', text: 'text-zinc-400', border: 'border-zinc-500/30' };
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await fetch('/api/market-intelligence/opportunities');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOpportunities(data.opportunities || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOpportunities(); }, [fetchOpportunities]);

  const analyzeOpp = useCallback(async (opp: Opportunity) => {
    setAnalyzingId(opp.id);
    try {
      const res = await fetch('/api/market-intelligence/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: opp.referenceVideoTitle || opp.niche,
          channelTitle: opp.referenceChannelTitle,
          viewCount: opp.averageViews,
          viralScore: opp.viralScore,
          niche: opp.niche,
          opportunityId: opp.id,
        }),
      });
      if (res.ok) {
        await fetchOpportunities();
        setExpandedId(opp.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingId(null);
    }
  }, [fetchOpportunities]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    try {
      await fetch(`/api/market-intelligence/opportunities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const deleteOpp = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/market-intelligence/opportunities/${id}`, { method: 'DELETE' });
      setOpportunities(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }, []);

  const filtered = statusFilter
    ? opportunities.filter(o => o.status === statusFilter)
    : opportunities;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Bookmark className="h-6 w-6 text-emerald-400" />
          </div>
          Oportunidades Salvas
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as oportunidades de nicho que você identificou no YouTube.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('')}
          className={`text-xs px-3 py-1.5 rounded-md transition-colors ${!statusFilter ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
        >
          Todas ({opportunities.length})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const count = opportunities.filter(o => o.status === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${statusFilter === key ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Bookmark className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Nenhuma oportunidade salva</h3>
          <p className="text-sm text-muted-foreground mt-1">Use o Market Intelligence para encontrar e salvar oportunidades.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((opp, idx) => {
            const isExpanded = expandedId === opp.id;
            let analysis: any = null;
            let ideas: string[] = [];
            try { analysis = opp.aiAnalysis ? JSON.parse(opp.aiAnalysis) : null; } catch { analysis = null; }
            try { ideas = opp.derivedIdeas ? JSON.parse(opp.derivedIdeas) : []; } catch { ideas = []; }
            const badge = opp.viralScore ? getViralBadge(opp.viralScore) : null;
            const StatusIcon = STATUS_CONFIG[opp.status]?.icon || Clock;
            const statusColor = STATUS_CONFIG[opp.status]?.color || 'text-zinc-400';

            return (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium truncate">
                        {opp.referenceVideoTitle || opp.niche}
                      </h3>
                      {badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} border ${badge.border} flex items-center gap-1 flex-shrink-0`}>
                          <Zap className="h-2.5 w-2.5" />
                          {opp.viralScore}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {opp.referenceChannelTitle && <span>{opp.referenceChannelTitle}</span>}
                      {opp.niche && <span className="bg-muted px-1.5 py-0.5 rounded">{opp.niche}</span>}
                      {opp.estimatedRevenue && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <DollarSign className="h-3 w-3" />
                          {opp.estimatedRevenue}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusIcon className={`h-4 w-4 ${statusColor}`} />

                    <select
                      value={opp.status}
                      onClick={e => e.stopPropagation()}
                      onChange={e => updateStatus(opp.id, e.target.value)}
                      className="text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none"
                    >
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>

                    {!opp.aiAnalysis && (
                      <button
                        onClick={(e) => { e.stopPropagation(); analyzeOpp(opp); }}
                        disabled={analyzingId === opp.id}
                        className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        {analyzingId === opp.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                        Analisar
                      </button>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); deleteOpp(opp.id); }}
                      disabled={deletingId === opp.id}
                      className="text-xs p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      {deletingId === opp.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border p-4 space-y-4">
                        {/* Quick Stats */}
                        <div className="flex flex-wrap gap-3">
                          {opp.averageViews != null && (
                            <div className="bg-background rounded-lg px-3 py-2 border border-border">
                              <p className="text-[10px] text-muted-foreground uppercase">Views</p>
                              <p className="text-sm font-medium flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-blue-400" />{opp.averageViews.toLocaleString()}</p>
                            </div>
                          )}
                          {opp.averageViewsPerDay != null && (
                            <div className="bg-background rounded-lg px-3 py-2 border border-border">
                              <p className="text-[10px] text-muted-foreground uppercase">Views/dia</p>
                              <p className="text-sm font-medium flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-emerald-400" />{Math.round(opp.averageViewsPerDay).toLocaleString()}</p>
                            </div>
                          )}
                          {opp.competitionLevel && (
                            <div className="bg-background rounded-lg px-3 py-2 border border-border">
                              <p className="text-[10px] text-muted-foreground uppercase">Concorrência</p>
                              <p className="text-sm font-medium capitalize">{opp.competitionLevel}</p>
                            </div>
                          )}
                          {opp.opportunityLevel && (
                            <div className="bg-background rounded-lg px-3 py-2 border border-border">
                              <p className="text-[10px] text-muted-foreground uppercase">Oportunidade</p>
                              <p className="text-sm font-medium capitalize text-emerald-400">{opp.opportunityLevel}</p>
                            </div>
                          )}
                          {opp.monetizationPotential && (
                            <div className="bg-background rounded-lg px-3 py-2 border border-border">
                              <p className="text-[10px] text-muted-foreground uppercase">Monetização</p>
                              <p className="text-sm font-medium capitalize text-amber-400">{opp.monetizationPotential}</p>
                            </div>
                          )}
                        </div>

                        {opp.referenceVideoId && (
                          <a
                            href={`https://www.youtube.com/watch?v=${opp.referenceVideoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver vídeo de referência no YouTube
                          </a>
                        )}

                        {analysis && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-purple-400" />
                              Análise de IA
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {analysis.whyItWorked && (
                                <div className="bg-background rounded-lg p-3 border border-border">
                                  <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-1">Por que funcionou</p>
                                  <p className="text-xs text-muted-foreground">{analysis.whyItWorked}</p>
                                </div>
                              )}
                              {analysis.originalApproach && (
                                <div className="bg-background rounded-lg p-3 border border-border">
                                  <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Abordagem original</p>
                                  <p className="text-xs text-muted-foreground">{analysis.originalApproach}</p>
                                </div>
                              )}
                              {analysis.nicheRecommendation && (
                                <div className="bg-background rounded-lg p-3 border border-border md:col-span-2">
                                  <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Recomendação</p>
                                  <p className="text-xs text-muted-foreground">{analysis.nicheRecommendation}</p>
                                </div>
                              )}
                            </div>

                            {ideas.length > 0 && (
                              <div>
                                <p className="text-xs font-medium mb-2">Ideias derivadas:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {ideas.map((idea: string, i: number) => (
                                    <div key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                      <span className="text-purple-400 font-mono text-[10px] mt-0.5">{i + 1}.</span>
                                      {idea}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(analysis.risks || opp.risks) && (
                              <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                                <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Riscos</p>
                                <p className="text-xs text-muted-foreground">{analysis.risks || opp.risks}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {opp.suggestedAngle && !analysis && (
                          <div className="bg-background rounded-lg p-3 border border-border">
                            <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Ângulo recomendado</p>
                            <p className="text-xs text-muted-foreground">{opp.suggestedAngle}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
