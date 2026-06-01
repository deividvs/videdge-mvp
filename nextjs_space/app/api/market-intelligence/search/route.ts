export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchYouTubeVideos, getVideoStats, getChannelStats, getPublishedAfterDate, getYoutubeApiKey } from '@/lib/youtube';
import { calculateViralScore, calculateViewsPerDay, calculateViewsSubscriberRatio, calculateEngagementRate } from '@/lib/viral-score';
import { getRPMForNiche, estimateRevenue } from '@/lib/revenue-estimator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const userId = (session.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await request.json();
    const { query, country, language, period, category, maxResults, minViews, maxSubscribers, minViralScore } = body || {};

    if (!query) return NextResponse.json({ error: 'Palavra-chave é obrigatória' }, { status: 400 });

    // Build search query with category context
    let searchQuery = query;
    if (category && category !== 'outro') {
      searchQuery = `${query} ${category}`;
    }

    // Get user's YouTube API key
    const ytApiKey = await getYoutubeApiKey(userId);

    // Search YouTube
    const publishedAfter = period ? getPublishedAfterDate(period) : undefined;
    const searchResults = await searchYouTubeVideos(searchQuery, {
      maxResults: Math.min(maxResults || 25, 50),
      regionCode: country || undefined,
      relevanceLanguage: language || undefined,
      publishedAfter,
      order: 'viewCount',
      apiKey: ytApiKey,
    });

    if (searchResults.length === 0) {
      return NextResponse.json({ videos: [], channels: [], message: 'Nenhum vídeo encontrado' });
    }

    // Get video stats
    const videoIds = searchResults.map(v => v.videoId);
    const videoStats = await getVideoStats(videoIds, ytApiKey);

    // Get unique channel stats
    const uniqueChannelIds = [...new Set(videoStats.map(v => v.channelId).filter(Boolean))];
    const channelStats = await getChannelStats(uniqueChannelIds, ytApiKey);
    const channelMap = new Map(channelStats.map(c => [c.channelId, c]));

    // Calculate metrics for each video
    const enrichedVideos = videoStats.map(video => {
      const channel = channelMap.get(video.channelId);
      const subs = channel?.subscriberCount || 0;
      const vpd = calculateViewsPerDay(video.viewCount, video.publishedAt);
      const vsr = calculateViewsSubscriberRatio(video.viewCount, subs);
      const er = calculateEngagementRate(video.viewCount, video.likeCount, video.commentCount);
      const vs = calculateViralScore({
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        commentCount: video.commentCount,
        publishedAt: video.publishedAt,
        subscriberCount: subs,
        channelVideoCount: channel?.videoCount,
        channelTotalViews: channel?.viewCount,
      });

      // Revenue estimate for channel
      const rpm = getRPMForNiche(category || query);
      const channelMonthlyViews = channel ? Math.round(channel.viewCount / Math.max(1, channel.videoCount) * 4) : 0;
      const revenue = estimateRevenue(channelMonthlyViews, rpm);

      return {
        youtubeVideoId: video.videoId,
        title: video.title,
        description: video.description,
        videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
        thumbnailUrl: video.thumbnailUrl,
        channelId: video.channelId,
        channelTitle: video.channelTitle,
        publishedAt: video.publishedAt,
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        commentCount: video.commentCount,
        duration: video.duration,
        tags: video.tags?.join(', ') || '',
        viralScore: vs,
        viewsPerDay: vpd,
        viewsSubscriberRatio: vsr,
        engagementRate: er,
        subscriberCount: subs,
        detectedNiche: category || query,
        revenueConservative: revenue.conservative,
        revenueAverage: revenue.average,
        revenueAggressive: revenue.aggressive,
      };
    });

    // Apply filters
    let filtered = enrichedVideos;
    if (minViews) filtered = filtered.filter(v => v.viewCount >= Number(minViews));
    if (maxSubscribers) filtered = filtered.filter(v => v.subscriberCount <= Number(maxSubscribers));
    if (minViralScore) filtered = filtered.filter(v => v.viralScore >= Number(minViralScore));

    // Sort by viral score
    filtered.sort((a, b) => b.viralScore - a.viralScore);

    // Save search record
    await prisma.youTubeSearch.create({
      data: {
        userId,
        query,
        country: country || null,
        language: language || null,
        period: period || null,
        category: category || null,
        resultCount: filtered.length,
      },
    });

    // Upsert videos to DB
    for (const video of filtered.slice(0, 50)) {
      await prisma.youTubeVideo.upsert({
        where: { userId_youtubeVideoId: { userId, youtubeVideoId: video.youtubeVideoId } },
        update: {
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          commentCount: video.commentCount,
          viralScore: video.viralScore,
          viewsPerDay: video.viewsPerDay,
          viewsSubscriberRatio: video.viewsSubscriberRatio,
          engagementRate: video.engagementRate,
          detectedNiche: video.detectedNiche,
        },
        create: {
          userId,
          youtubeVideoId: video.youtubeVideoId,
          title: video.title,
          description: (video.description || '').slice(0, 2000),
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          channelId: video.channelId,
          channelTitle: video.channelTitle,
          publishedAt: new Date(video.publishedAt),
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          commentCount: video.commentCount,
          duration: video.duration,
          tags: video.tags,
          viralScore: video.viralScore,
          viewsPerDay: video.viewsPerDay,
          viewsSubscriberRatio: video.viewsSubscriberRatio,
          engagementRate: video.engagementRate,
          detectedNiche: video.detectedNiche,
          searchQuery: query,
        },
      });
    }

    // Upsert channels
    const channelList = channelStats.map(ch => {
      const rpm = getRPMForNiche(category || query);
      const monthlyViews = Math.round(ch.viewCount / Math.max(1, ch.videoCount) * 4);
      const revenue = estimateRevenue(monthlyViews, rpm);
      return {
        youtubeChannelId: ch.channelId,
        title: ch.title,
        channelUrl: `https://www.youtube.com/channel/${ch.channelId}`,
        description: (ch.description || '').slice(0, 2000),
        subscriberCount: ch.subscriberCount,
        totalViewCount: BigInt(ch.viewCount),
        videoCount: ch.videoCount,
        country: ch.country,
        thumbnailUrl: ch.thumbnailUrl,
        estimatedMonthlyViews: monthlyViews,
        revenueConservative: revenue.conservative,
        revenueAverage: revenue.average,
        revenueAggressive: revenue.aggressive,
        revenueConfidence: 'médio',
      };
    });

    for (const ch of channelList) {
      await prisma.youTubeChannel.upsert({
        where: { userId_youtubeChannelId: { userId, youtubeChannelId: ch.youtubeChannelId } },
        update: {
          subscriberCount: ch.subscriberCount,
          totalViewCount: ch.totalViewCount,
          videoCount: ch.videoCount,
          estimatedMonthlyViews: ch.estimatedMonthlyViews,
          revenueConservative: ch.revenueConservative,
          revenueAverage: ch.revenueAverage,
          revenueAggressive: ch.revenueAggressive,
        },
        create: { userId, ...ch },
      });
    }

    // Serialize BigInt for response
    const serializedChannels = channelList.map(ch => ({
      ...ch,
      totalViewCount: Number(ch.totalViewCount),
    }));

    return NextResponse.json({
      videos: filtered,
      channels: serializedChannels,
      totalResults: filtered.length,
    });
  } catch (error: any) {
    console.error('Market Intelligence search error:', error);
    if (error.message?.includes('quota')) {
      return NextResponse.json({ error: 'Quota da API do YouTube excedida. Tente novamente mais tarde.' }, { status: 429 });
    }
    return NextResponse.json({ error: error.message || 'Erro ao pesquisar' }, { status: 500 });
  }
}
