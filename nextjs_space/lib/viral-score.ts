/**
 * Viral Score Calculator
 * Scores videos 0-100 based on performance relative to channel size and niche
 */

interface VideoScoreInput {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string | Date;
  subscriberCount: number;
  channelVideoCount?: number;
  channelTotalViews?: number;
}

export function calculateViralScore(video: VideoScoreInput): number {
  const now = new Date();
  const published = new Date(video.publishedAt);
  const daysSincePublish = Math.max(1, Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24)));
  const subs = Math.max(1, video.subscriberCount);
  const views = video.viewCount;

  // 1. Views per day velocity (0-25 pts)
  const viewsPerDay = views / daysSincePublish;
  let velocityScore = 0;
  if (viewsPerDay >= 100000) velocityScore = 25;
  else if (viewsPerDay >= 50000) velocityScore = 22;
  else if (viewsPerDay >= 10000) velocityScore = 18;
  else if (viewsPerDay >= 5000) velocityScore = 15;
  else if (viewsPerDay >= 1000) velocityScore = 12;
  else if (viewsPerDay >= 500) velocityScore = 9;
  else if (viewsPerDay >= 100) velocityScore = 6;
  else if (viewsPerDay >= 50) velocityScore = 3;
  else velocityScore = 1;

  // 2. Views/subscribers ratio (0-30 pts) - key outlier indicator
  const viewSubRatio = views / subs;
  let ratioScore = 0;
  if (viewSubRatio >= 10) ratioScore = 30;
  else if (viewSubRatio >= 5) ratioScore = 27;
  else if (viewSubRatio >= 3) ratioScore = 24;
  else if (viewSubRatio >= 2) ratioScore = 20;
  else if (viewSubRatio >= 1) ratioScore = 16;
  else if (viewSubRatio >= 0.5) ratioScore = 12;
  else if (viewSubRatio >= 0.2) ratioScore = 8;
  else if (viewSubRatio >= 0.1) ratioScore = 4;
  else ratioScore = 1;

  // 3. Engagement rate (0-20 pts)
  const engagement = views > 0 ? ((video.likeCount + video.commentCount) / views) * 100 : 0;
  let engagementScore = 0;
  if (engagement >= 10) engagementScore = 20;
  else if (engagement >= 7) engagementScore = 17;
  else if (engagement >= 5) engagementScore = 14;
  else if (engagement >= 3) engagementScore = 11;
  else if (engagement >= 2) engagementScore = 8;
  else if (engagement >= 1) engagementScore = 5;
  else engagementScore = 2;

  // 4. Channel size normalization bonus (0-15 pts) - small channels with big videos
  let sizeBonus = 0;
  if (subs < 1000 && views > 10000) sizeBonus = 15;
  else if (subs < 5000 && views > 50000) sizeBonus = 15;
  else if (subs < 10000 && views > 100000) sizeBonus = 13;
  else if (subs < 50000 && views > 500000) sizeBonus = 11;
  else if (subs < 100000 && views > 1000000) sizeBonus = 9;
  else if (subs < 500000 && viewSubRatio > 2) sizeBonus = 6;
  else sizeBonus = 2;

  // 5. Recency bonus (0-10 pts) - recent videos get a boost
  let recencyBonus = 0;
  if (daysSincePublish <= 3) recencyBonus = 10;
  else if (daysSincePublish <= 7) recencyBonus = 8;
  else if (daysSincePublish <= 14) recencyBonus = 6;
  else if (daysSincePublish <= 30) recencyBonus = 4;
  else if (daysSincePublish <= 60) recencyBonus = 2;
  else recencyBonus = 0;

  const total = Math.min(100, velocityScore + ratioScore + engagementScore + sizeBonus + recencyBonus);
  return Math.round(total);
}

export function getViralLabel(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Outlier viral', color: '#f59e0b' };
  if (score >= 70) return { label: 'Alto potencial', color: '#10b981' };
  if (score >= 40) return { label: 'Potencial moderado', color: '#3b82f6' };
  return { label: 'Baixo potencial', color: '#6b7280' };
}

export function calculateViewsPerDay(viewCount: number, publishedAt: string | Date): number {
  const now = new Date();
  const published = new Date(publishedAt);
  const days = Math.max(1, Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24)));
  return Math.round((viewCount / days) * 100) / 100;
}

export function calculateViewsSubscriberRatio(viewCount: number, subscriberCount: number): number {
  if (subscriberCount <= 0) return 0;
  return Math.round((viewCount / subscriberCount) * 100) / 100;
}

export function calculateEngagementRate(viewCount: number, likeCount: number, commentCount: number): number {
  if (viewCount <= 0) return 0;
  return Math.round(((likeCount + commentCount) / viewCount) * 10000) / 100;
}
