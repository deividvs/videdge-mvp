/**
 * YouTube Data API v3 - Comments integration
 * Fetches public comments from YouTube videos
 */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.YOUTUBE_API_KEY;

export interface YouTubeCommentData {
  commentId: string;
  authorDisplayName: string;
  text: string;
  likeCount: number;
  publishedAt: string;
  updatedAt: string;
  isReply: boolean;
  parentCommentId: string | null;
  totalReplyCount: number;
}

export interface FetchCommentsResult {
  comments: YouTubeCommentData[];
  totalResults: number;
  nextPageToken?: string;
}

/**
 * Fetch public comments from a YouTube video using commentThreads endpoint.
 * Collects up to maxComments (default 200) with pagination.
 */
export async function fetchVideoComments(
  videoId: string,
  maxComments: number = 200
): Promise<FetchCommentsResult> {
  if (!API_KEY) throw new Error('YOUTUBE_API_KEY não configurada');

  const allComments: YouTubeCommentData[] = [];
  let nextPageToken: string | undefined;
  const maxPerPage = 100; // YouTube API max

  while (allComments.length < maxComments) {
    const remaining = maxComments - allComments.length;
    const pageSize = Math.min(remaining, maxPerPage);

    const params = new URLSearchParams({
      part: 'snippet,replies',
      videoId,
      maxResults: String(pageSize),
      order: 'relevance',
      textFormat: 'plainText',
      key: API_KEY,
    });
    if (nextPageToken) params.set('pageToken', nextPageToken);

    const res = await fetch(`${YOUTUBE_API_BASE}/commentThreads?${params}`);
    if (!res.ok) {
      const errText = await res.text();
      console.error('YouTube Comments API error:', errText);
      // If comments are disabled, return empty
      if (errText.includes('commentsDisabled') || errText.includes('disabled comments')) {
        return { comments: [], totalResults: 0 };
      }
      throw new Error(`Erro ao buscar comentários: ${res.status}`);
    }

    const data = await res.json();
    const totalResults = data.pageInfo?.totalResults || 0;

    for (const thread of data.items || []) {
      const topComment = thread.snippet?.topLevelComment;
      if (!topComment) continue;

      allComments.push({
        commentId: topComment.id,
        authorDisplayName: topComment.snippet?.authorDisplayName || 'Anônimo',
        text: topComment.snippet?.textDisplay || '',
        likeCount: topComment.snippet?.likeCount || 0,
        publishedAt: topComment.snippet?.publishedAt || '',
        updatedAt: topComment.snippet?.updatedAt || '',
        isReply: false,
        parentCommentId: null,
        totalReplyCount: thread.snippet?.totalReplyCount || 0,
      });

      // Also collect replies if available
      if (thread.replies?.comments) {
        for (const reply of thread.replies.comments) {
          allComments.push({
            commentId: reply.id,
            authorDisplayName: reply.snippet?.authorDisplayName || 'Anônimo',
            text: reply.snippet?.textDisplay || '',
            likeCount: reply.snippet?.likeCount || 0,
            publishedAt: reply.snippet?.publishedAt || '',
            updatedAt: reply.snippet?.updatedAt || '',
            isReply: true,
            parentCommentId: reply.snippet?.parentId || topComment.id,
            totalReplyCount: 0,
          });
        }
      }
    }

    nextPageToken = data.nextPageToken;
    if (!nextPageToken) break;
  }

  return {
    comments: allComments,
    totalResults: allComments.length,
    nextPageToken,
  };
}

/**
 * Filter and clean comments for AI analysis.
 * Removes spam, duplicates, very short comments, and prioritizes useful ones.
 */
export function cleanCommentsForAnalysis(
  comments: YouTubeCommentData[]
): { useful: YouTubeCommentData[]; removed: number } {
  const seen = new Set<string>();
  const spamPatterns = [
    /https?:\/\//i,
    /subscribe.*channel/i,
    /check.*my.*channel/i,
    /follow.*me/i,
    /link.*bio/i,
    /\$\$\$/,
    /earn.*money.*online/i,
    /ganhe.*dinheiro/i,
    /clique.*aqui/i,
    /inscreva.*se.*no.*meu/i,
  ];

  let removed = 0;
  const useful: YouTubeCommentData[] = [];

  for (const c of comments) {
    const normalized = c.text.trim().toLowerCase();

    // Skip very short comments (< 10 chars)
    if (normalized.length < 10) { removed++; continue; }

    // Skip duplicates
    if (seen.has(normalized)) { removed++; continue; }
    seen.add(normalized);

    // Skip spam
    if (spamPatterns.some(p => p.test(c.text))) { removed++; continue; }

    // Skip comments that are just emojis
    const noEmoji = c.text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]/gu, '').trim();
    if (noEmoji.length < 5) { removed++; continue; }

    useful.push(c);
  }

  // Sort: prioritize comments with more likes and longer text
  useful.sort((a, b) => {
    const scoreA = a.likeCount * 2 + Math.min(a.text.length / 50, 5);
    const scoreB = b.likeCount * 2 + Math.min(b.text.length / 50, 5);
    return scoreB - scoreA;
  });

  return { useful, removed };
}

/**
 * Format comments for LLM prompt (anonymized, limited)
 */
export function formatCommentsForPrompt(
  comments: YouTubeCommentData[],
  maxComments: number = 150
): string {
  const selected = comments.slice(0, maxComments);
  return selected
    .map((c, i) => `[${i + 1}] (${c.likeCount} likes) ${c.text.replace(/\n/g, ' ').trim()}`)
    .join('\n');
}
