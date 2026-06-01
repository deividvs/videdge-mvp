export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchVideoComments, cleanCommentsForAnalysis } from '@/lib/youtube-comments';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });

    const body = await request.json();
    const { videoId, videoTitle, channelTitle, maxComments = 200 } = body || {};

    if (!videoId) {
      return new Response(JSON.stringify({ error: 'videoId é obrigatório' }), { status: 400 });
    }

    // Check if we already have comments cached for this video
    const existing = await prisma.youTubeComment.findMany({
      where: { userId, youtubeVideoId: videoId },
      orderBy: { likeCount: 'desc' },
    });

    if (existing.length > 50) {
      // Return cached comments
      const useful = existing.filter(c => c.isUseful);
      return new Response(JSON.stringify({
        comments: useful.map(c => ({
          commentId: c.youtubeCommentId,
          text: c.text,
          likeCount: c.likeCount,
          publishedAt: c.publishedAt,
          isReply: c.isReply,
          sentiment: c.detectedSentiment,
          theme: c.detectedTheme,
        })),
        totalCollected: existing.length,
        usefulCount: useful.length,
        spamRemoved: existing.length - useful.length,
        fromCache: true,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Fetch fresh comments from YouTube
    const result = await fetchVideoComments(videoId, maxComments);
    
    if (result.comments.length === 0) {
      return new Response(JSON.stringify({
        comments: [],
        totalCollected: 0,
        usefulCount: 0,
        spamRemoved: 0,
        fromCache: false,
        message: 'Nenhum comentário encontrado. Comentários podem estar desativados neste vídeo.',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Clean comments
    const { useful, removed } = cleanCommentsForAnalysis(result.comments);

    // Save to database
    for (const c of result.comments) {
      const isUseful = useful.some(u => u.commentId === c.commentId);
      await prisma.youTubeComment.upsert({
        where: { userId_youtubeCommentId: { userId, youtubeCommentId: c.commentId } },
        create: {
          userId,
          youtubeVideoId: videoId,
          youtubeCommentId: c.commentId,
          authorDisplayName: c.authorDisplayName,
          text: c.text,
          likeCount: c.likeCount,
          publishedAt: c.publishedAt ? new Date(c.publishedAt) : null,
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : null,
          isReply: c.isReply,
          parentCommentId: c.parentCommentId,
          isUseful,
        },
        update: {
          text: c.text,
          likeCount: c.likeCount,
          isUseful,
        },
      });
    }

    return new Response(JSON.stringify({
      comments: useful.map(c => ({
        commentId: c.commentId,
        text: c.text,
        likeCount: c.likeCount,
        publishedAt: c.publishedAt,
        isReply: c.isReply,
      })),
      totalCollected: result.comments.length,
      usefulCount: useful.length,
      spamRemoved: removed,
      fromCache: false,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Comments fetch error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro ao buscar comentários' }), { status: 500 });
  }
}
