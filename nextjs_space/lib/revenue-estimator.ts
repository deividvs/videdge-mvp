/**
 * Revenue Estimator
 * Estimates monthly AdSense revenue for YouTube channels
 */

export interface RPMValues {
  conservative: number;
  average: number;
  aggressive: number;
}

export interface RevenueEstimate {
  estimatedMonthlyViews: number;
  confidenceLevel: 'baixo' | 'médio' | 'alto';
  calculationMethod: string;
  revenueConservative: number;
  revenueAverage: number;
  revenueAggressive: number;
  rpm: RPMValues;
}

// Default RPM benchmarks by niche (USD)
export const DEFAULT_RPM_BENCHMARKS: Record<string, RPMValues> = {
  'finanças': { conservative: 4, average: 8, aggressive: 15 },
  'negócios': { conservative: 3, average: 7, aggressive: 12 },
  'tecnologia': { conservative: 2, average: 5, aggressive: 10 },
  'saúde': { conservative: 2, average: 5, aggressive: 9 },
  'educação': { conservative: 1.5, average: 4, aggressive: 8 },
  'luxo': { conservative: 2, average: 5, aggressive: 10 },
  'crimes reais': { conservative: 1, average: 3, aggressive: 6 },
  'curiosidades': { conservative: 0.8, average: 2, aggressive: 5 },
  'entretenimento': { conservative: 0.5, average: 1.5, aggressive: 4 },
  'espiritualidade': { conservative: 0.8, average: 2.5, aggressive: 6 },
  'infantil': { conservative: 0.3, average: 1, aggressive: 3 },
  'documentário': { conservative: 1, average: 3, aggressive: 7 },
  'outro': { conservative: 0.5, average: 2, aggressive: 5 },
};

export function estimateRevenue(
  monthlyViews: number,
  rpm: RPMValues
): { conservative: number; average: number; aggressive: number } {
  return {
    conservative: Math.round((monthlyViews / 1000) * rpm.conservative * 100) / 100,
    average: Math.round((monthlyViews / 1000) * rpm.average * 100) / 100,
    aggressive: Math.round((monthlyViews / 1000) * rpm.aggressive * 100) / 100,
  };
}

export function estimateMonthlyViews(
  recentVideos: { viewCount: number; publishedAt: string | Date }[],
  videosPerMonth?: number
): { views: number; confidence: 'baixo' | 'médio' | 'alto'; method: string } {
  if (!recentVideos || recentVideos.length === 0) {
    return { views: 0, confidence: 'baixo', method: 'Sem dados disponíveis' };
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter videos from last 30 days
  const recentMonth = recentVideos.filter(
    v => new Date(v.publishedAt) >= thirtyDaysAgo
  );

  if (recentMonth.length >= 3) {
    // High confidence: 3+ videos in last 30 days
    const totalViews = recentMonth.reduce((sum, v) => sum + v.viewCount, 0);
    return {
      views: totalViews,
      confidence: 'alto',
      method: `Soma de ${recentMonth.length} vídeos dos últimos 30 dias`,
    };
  }

  // Medium confidence: use average views per video × posting frequency
  const avgViews = recentVideos.reduce((sum, v) => sum + v.viewCount, 0) / recentVideos.length;
  const postsPerMonth = videosPerMonth || Math.max(1, recentVideos.length);
  const estimatedViews = Math.round(avgViews * postsPerMonth);

  return {
    views: estimatedViews,
    confidence: recentVideos.length >= 5 ? 'médio' : 'baixo',
    method: `Média de ${Math.round(avgViews).toLocaleString()} views × ${postsPerMonth} vídeos/mês`,
  };
}

export function getRPMForNiche(niche: string | undefined | null): RPMValues {
  if (!niche) return DEFAULT_RPM_BENCHMARKS['outro'];
  const normalized = niche.toLowerCase().trim();
  // Try exact match first
  if (DEFAULT_RPM_BENCHMARKS[normalized]) return DEFAULT_RPM_BENCHMARKS[normalized];
  // Try partial match
  for (const [key, val] of Object.entries(DEFAULT_RPM_BENCHMARKS)) {
    if (normalized.includes(key) || key.includes(normalized)) return val;
  }
  return DEFAULT_RPM_BENCHMARKS['outro'];
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
