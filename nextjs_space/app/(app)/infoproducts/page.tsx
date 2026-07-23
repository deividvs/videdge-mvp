'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Loader2, Trash2, Sparkles, Video, Globe, ChevronDown, ChevronUp,
  Target, Heart, Zap, DollarSign, ShieldAlert, Lightbulb, TrendingUp, Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface Infoproduct {
  id: string;
  youtubeVideoId: string | null;
  name: string;
  productType: string | null;
  targetAudience: string | null;
  mainPain: string | null;
  mainDesire: string | null;
  promise: string | null;
  uniqueMechanism: string | null;
  recommendedFormat: string | null;
  suggestedModules: any;
  suggestedTicket: string | null;
  opportunityScore: number;
  scoreReason: string | null;
  productionEase: number;
  salesPotential: number;
  marketRisk: string | null;
  expectedObjections: any;
  leadMagnetIdea: string | null;
  validationOffer: string | null;
  youtubeSalesStrategy: string | null;
  generatedOffer: any;
  generatedVsl: any;
  generatedSalesPage: any;
  createdAt: string;
  updatedAt: string;
}

function scoreBadge(score: number) {
  if (score >= 85) return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
  if (score >= 70) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  if (score >= 40) return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' };
  return { bg: 'bg-zinc-500/20', text: 'text-zinc-400', border: 'border-zinc-500/30' };
}

export default function InfoproductsPage() {
  const [products, setProducts] = useState<Infoproduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/infoproducts');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(data.infoproducts || []);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const generateContent = useCallback(async (id: string, type: string) => {
    const key = `${id}-${type}`;
    setGenerating(key);
    try {
      const res = await fetch('/api/infoproducts/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId: id, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const field = type === 'offer' ? 'generatedOffer' : type === 'vsl' ? 'generatedVsl' : 'generatedSalesPage';
      setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: data.result } : p));
      toast.success(`${type === 'offer' ? 'Oferta' : type === 'vsl' ? 'VSL' : 'Página de vendas'} gerada e salva!`);
    } catch (err: any) {
      toast.error(err.message || 'Erro na geração');
    } finally {
      setGenerating(null);
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch('/api/infoproducts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Erro ao remover');
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Produto removido da lista.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  }, []);

  const exportProduct = useCallback((p: Infoproduct) => {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infoproduto-${p.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Produto exportado!');
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-emerald-400" /> Infoprodutos Salvos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ideias de produtos salvas a partir da análise de comentários. Gere ofertas, VSLs e páginas de vendas e trabalhe suas ideias quando quiser.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum infoproduto salvo ainda</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Vá para o Comment Intelligence, analise os comentários de um vídeo e clique em "Salvar Produto" nas ideias geradas. Elas aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => {
            const badge = scoreBadge(p.opportunityScore);
            const isOpen = expandedId === p.id;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold">{p.name}</h3>
                        {p.productType && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20">{p.productType}</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${badge.bg} ${badge.text} border ${badge.border}`}>
                          Score {p.opportunityScore}
                        </span>
                      </div>
                      {p.promise && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.promise}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => exportProduct(p)}
                        title="Exportar"
                        className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        disabled={deletingId === p.id}
                        title="Remover da lista"
                        className="p-2 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setExpandedId(isOpen ? null : p.id)}
                        className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Quick metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="rounded-lg bg-muted/50 border border-border p-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Facilidade Produção</p>
                      <p className="text-sm font-semibold text-blue-400">{p.productionEase}/100</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 border border-border p-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Potencial Vendas</p>
                      <p className="text-sm font-semibold text-emerald-400">{p.salesPotential}/100</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 border border-border p-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ticket Sugerido</p>
                      <p className="text-sm font-semibold text-amber-400">{p.suggestedTicket || '—'}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 border border-border p-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Formato</p>
                      <p className="text-sm font-semibold text-purple-400">{p.recommendedFormat || '—'}</p>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="p-5 space-y-5">
                        {/* Details grid */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          {p.targetAudience && (
                            <Detail icon={Target} color="text-blue-400" label="Público-Alvo" value={p.targetAudience} />
                          )}
                          {p.mainPain && (
                            <Detail icon={ShieldAlert} color="text-red-400" label="Dor Principal" value={p.mainPain} />
                          )}
                          {p.mainDesire && (
                            <Detail icon={Heart} color="text-pink-400" label="Desejo Principal" value={p.mainDesire} />
                          )}
                          {p.uniqueMechanism && (
                            <Detail icon={Zap} color="text-amber-400" label="Mecanismo Único" value={p.uniqueMechanism} />
                          )}
                          {p.leadMagnetIdea && (
                            <Detail icon={Lightbulb} color="text-yellow-400" label="Isca (Lead Magnet)" value={p.leadMagnetIdea} />
                          )}
                          {p.validationOffer && (
                            <Detail icon={DollarSign} color="text-emerald-400" label="Oferta de Validação" value={p.validationOffer} />
                          )}
                          {p.youtubeSalesStrategy && (
                            <Detail icon={TrendingUp} color="text-purple-400" label="Estratégia no YouTube" value={p.youtubeSalesStrategy} />
                          )}
                          {p.marketRisk && (
                            <Detail icon={ShieldAlert} color="text-orange-400" label="Risco de Mercado" value={p.marketRisk} />
                          )}
                        </div>

                        {Array.isArray(p.suggestedModules) && p.suggestedModules.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Módulos Sugeridos</p>
                            <div className="flex flex-wrap gap-2">
                              {p.suggestedModules.map((m: any, i: number) => (
                                <span key={i} className="px-3 py-1.5 rounded-lg text-xs bg-muted border border-border">{typeof m === 'string' ? m : (m?.name || JSON.stringify(m))}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Generation actions */}
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                          <GenButton
                            loading={generating === `${p.id}-offer`}
                            onClick={() => generateContent(p.id, 'offer')}
                            icon={Sparkles}
                            color="orange"
                            label={p.generatedOffer ? 'Regerar Oferta' : 'Gerar Oferta'}
                          />
                          <GenButton
                            loading={generating === `${p.id}-vsl`}
                            onClick={() => generateContent(p.id, 'vsl')}
                            icon={Video}
                            color="purple"
                            label={p.generatedVsl ? 'Regerar VSL' : 'Gerar VSL'}
                          />
                          <GenButton
                            loading={generating === `${p.id}-salespage`}
                            onClick={() => generateContent(p.id, 'salespage')}
                            icon={Globe}
                            color="blue"
                            label={p.generatedSalesPage ? 'Regerar Página' : 'Gerar Página de Vendas'}
                          />
                        </div>

                        {/* Generated content */}
                        {p.generatedOffer && <GeneratedBlock title="🎯 Oferta Gerada" content={p.generatedOffer} />}
                        {p.generatedVsl && <GeneratedBlock title="🎥 Roteiro VSL" content={p.generatedVsl} />}
                        {p.generatedSalesPage && <GeneratedBlock title="💻 Página de Vendas" content={p.generatedSalesPage} />}
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

function Detail({ icon: Icon, color, label, value }: { icon: any; color: string; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 border border-border p-3">
      <p className="text-xs font-medium flex items-center gap-1.5 mb-1">
        <Icon className={`h-3.5 w-3.5 ${color}`} /> {label}
      </p>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

function GenButton({ loading, onClick, icon: Icon, color, label }: { loading: boolean; onClick: () => void; icon: any; color: string; label: string }) {
  const colors: Record<string, string> = {
    orange: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/20',
    purple: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/20',
    blue: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20',
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-3 py-1.5 rounded-md text-xs border flex items-center gap-1.5 transition-colors disabled:opacity-50 ${colors[color]}`}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
      {label}
    </button>
  );
}

function GeneratedBlock({ title, content }: { title: string; content: any }) {
  return (
    <div className="mt-1 p-4 rounded-lg bg-muted border border-border">
      <h5 className="text-sm font-semibold mb-2">{title}</h5>
      <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-72 overflow-y-auto">
        {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
      </pre>
    </div>
  );
}
