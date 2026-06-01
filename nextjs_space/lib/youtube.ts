/**
 * YouTube Data API v3 integration
 * Handles search, video stats, and channel stats
 */

import { prisma } from '@/lib/prisma';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Get the YouTube API key for a user.
 * Uses user's custom key if set, otherwise falls back to env var.
 */
export async function getYoutubeApiKey(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { youtubeApiKey: true },
  });
  const key = user?.youtubeApiKey || process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YouTube API key não configurada. Vá em Settings para adicionar.');
  return key;
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
}

export interface YouTubeVideoStats {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  tags: string[];
}

export interface YouTubeChannelStats {
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  country: string;
}

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export async function searchYouTubeVideos(
  query: string,
  options: {
    maxResults?: number;
    regionCode?: string;
    relevanceLanguage?: string;
    publishedAfter?: string;
    order?: string;
    apiKey?: string;
  } = {}
): Promise<YouTubeSearchResult[]> {
  const API_KEY = options.apiKey || process.env.YOUTUBE_API_KEY;
  if (!API_KEY) throw new Error('YouTube API key not configured');

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    q: query,
    key: API_KEY,
    maxResults: String(options.maxResults || 25),
    order: options.order || 'relevance',
  });

  if (options.regionCode) params.set('regionCode', options.regionCode);
  if (options.relevanceLanguage) params.set('relevanceLanguage', options.relevanceLanguage);
  if (options.publishedAfter) params.set('publishedAfter', options.publishedAfter);

  const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `YouTube API error: ${res.status}`);
  }

  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    videoId: item.id?.videoId || '',
    title: item.snippet?.title || '',
    description: item.snippet?.description || '',
    thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
    channelId: item.snippet?.channelId || '',
    channelTitle: item.snippet?.channelTitle || '',
    publishedAt: item.snippet?.publishedAt || '',
  }));
}

export async function getVideoStats(videoIds: string[], apiKey?: string): Promise<YouTubeVideoStats[]> {
  const API_KEY = apiKey || process.env.YOUTUBE_API_KEY;
  if (!API_KEY) throw new Error('YouTube API key not configured');
  if (videoIds.length === 0) return [];

  // Process in batches of 50 (API limit)
  const results: YouTubeVideoStats[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const params = new URLSearchParams({
      part: 'snippet,statistics,contentDetails',
      id: batch.join(','),
      key: API_KEY,
    });

    const res = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `YouTube API error: ${res.status}`);
    }

    const data = await res.json();
    for (const item of data.items || []) {
      results.push({
        videoId: item.id || '',
        title: item.snippet?.title || '',
        description: item.snippet?.description || '',
        thumbnailUrl: item.snippet?.thumbnails?.high?.url || '',
        channelId: item.snippet?.channelId || '',
        channelTitle: item.snippet?.channelTitle || '',
        publishedAt: item.snippet?.publishedAt || '',
        viewCount: parseInt(item.statistics?.viewCount || '0'),
        likeCount: parseInt(item.statistics?.likeCount || '0'),
        commentCount: parseInt(item.statistics?.commentCount || '0'),
        duration: parseDuration(item.contentDetails?.duration || ''),
        tags: item.snippet?.tags || [],
      });
    }
  }
  return results;
}

export async function getChannelStats(channelIds: string[], apiKey?: string): Promise<YouTubeChannelStats[]> {
  const API_KEY = apiKey || process.env.YOUTUBE_API_KEY;
  if (!API_KEY) throw new Error('YouTube API key not configured');
  if (channelIds.length === 0) return [];

  const results: YouTubeChannelStats[] = [];
  for (let i = 0; i < channelIds.length; i += 50) {
    const batch = channelIds.slice(i, i + 50);
    const params = new URLSearchParams({
      part: 'snippet,statistics',
      id: batch.join(','),
      key: API_KEY,
    });

    const res = await fetch(`${YOUTUBE_API_BASE}/channels?${params}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `YouTube API error: ${res.status}`);
    }

    const data = await res.json();
    for (const item of data.items || []) {
      results.push({
        channelId: item.id || '',
        title: item.snippet?.title || '',
        description: item.snippet?.description || '',
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url || '',
        subscriberCount: parseInt(item.statistics?.subscriberCount || '0'),
        viewCount: parseInt(item.statistics?.viewCount || '0'),
        videoCount: parseInt(item.statistics?.videoCount || '0'),
        country: item.snippet?.country || '',
      });
    }
  }
  return results;
}

export function getPublishedAfterDate(period: string): string {
  const now = new Date();
  switch (period) {
    case '7d': now.setDate(now.getDate() - 7); break;
    case '30d': now.setDate(now.getDate() - 30); break;
    case '90d': now.setDate(now.getDate() - 90); break;
    case '12m': now.setFullYear(now.getFullYear() - 1); break;
    default: now.setDate(now.getDate() - 30);
  }
  return now.toISOString();
}
