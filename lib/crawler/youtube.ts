/**
 * YouTube Feed Crawler
 *
 * Uses YouTube Data API v3 to fetch videos from a channel or search query.
 * Deduplicates by videoId (externalId).
 * Requires YOUTUBE_API_KEY environment variable.
 */

import axios from 'axios';
import { prisma } from '@/lib/db';
import type { FeedSource } from '@prisma/client';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeSearchItem {
  id: {
    kind: string;
    videoId?: string;
  };
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelTitle: string;
    thumbnails?: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

interface CrawlResult {
  newCount: number;
  totalCount: number;
  errors: string[];
}

/**
 * Extract channelId from the FeedSource URL.
 * Supports formats:
 * - https://www.youtube.com/channel/UCxxxxxxxx
 * - UCxxxxxxxx (direct channel ID)
 */
function extractChannelId(url: string): string | null {
  const channelMatch = url.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/);
  if (channelMatch?.[1]) return channelMatch[1];

  // Direct channel ID format
  if (/^UC[A-Za-z0-9_-]{22}$/.test(url.trim())) return url.trim();

  return null;
}

export async function crawlYouTubeSource(source: FeedSource): Promise<CrawlResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY environment variable is not set');
  }

  const errors: string[] = [];
  let newCount = 0;

  const channelId = extractChannelId(source.url);
  if (!channelId) {
    throw new Error(`Cannot extract channelId from URL: ${source.url}`);
  }

  const response = await axios.get<YouTubeSearchResponse>(
    `${YOUTUBE_API_BASE}/search`,
    {
      params: {
        part: 'snippet',
        channelId,
        maxResults: 10,
        order: 'date',
        type: 'video',
        key: apiKey,
      },
      timeout: 15000,
    }
  );

  const items = response.data.items ?? [];
  const totalCount = items.length;

  for (const item of items) {
    try {
      const videoId = item.id?.videoId;
      if (!videoId) {
        errors.push(`Skipping non-video item: ${item.snippet?.title ?? 'unknown'}`);
        continue;
      }

      const externalId = videoId;
      const sourceUrl = `https://www.youtube.com/watch?v=${videoId}`;

      // Deduplicate by externalId
      const existing = await prisma.article.findUnique({
        where: { externalId },
        select: { id: true },
      });
      if (existing) continue;

      // Also check sourceUrl uniqueness
      const existingByUrl = await prisma.article.findUnique({
        where: { sourceUrl },
        select: { id: true },
      });
      if (existingByUrl) continue;

      const snippet = item.snippet;
      const title = snippet.title;
      const content = snippet.description || title;
      const author = snippet.channelTitle;
      const imageUrl =
        snippet.thumbnails?.high?.url ??
        snippet.thumbnails?.medium?.url ??
        snippet.thumbnails?.default?.url;
      const publishedAt = snippet.publishedAt
        ? new Date(snippet.publishedAt)
        : new Date();

      await prisma.article.create({
        data: {
          feedSourceId: source.id,
          externalId,
          title,
          originalTitle: title,
          content,
          author,
          imageUrl,
          sourceUrl,
          publishedAt,
          isActive: true,
        },
      });

      newCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Item error: ${msg}`);
    }
  }

  return { newCount, totalCount, errors };
}
