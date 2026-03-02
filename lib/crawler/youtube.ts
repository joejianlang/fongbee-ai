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
 * Extract channelId from YouTube handle using the YouTube API.
 * Supports format: @handle (e.g., @CBCNews)
 */
async function extractChannelIdFromHandle(
  handle: string,
  apiKey: string
): Promise<string | null> {
  try {
    const response = await axios.get(
      `${YOUTUBE_API_BASE}/channels`,
      {
        params: {
          part: 'id',
          forUsername: handle,
          key: apiKey,
        },
        timeout: 10000,
      }
    );

    const channels = response.data.items;
    if (!channels || channels.length === 0) {
      // Try with search API if forUsername doesn't work
      const searchResponse = await axios.get(
        `${YOUTUBE_API_BASE}/search`,
        {
          params: {
            part: 'snippet',
            q: handle,
            type: 'channel',
            maxResults: 1,
            key: apiKey,
          },
          timeout: 10000,
        }
      );

      const searchItems = searchResponse.data.items;
      if (searchItems && searchItems.length > 0) {
        return searchItems[0].snippet?.channelId || null;
      }
      return null;
    }

    return channels[0].id;
  } catch {
    return null;
  }
}

/**
 * Extract channelId from the FeedSource URL.
 * Supports formats:
 * - https://www.youtube.com/channel/UCxxxxxxxx
 * - https://www.youtube.com/@handle
 * - @handle
 * - UCxxxxxxxx (direct channel ID)
 */
async function extractChannelId(url: string, apiKey: string): Promise<string | null> {
  // Try old format: youtube.com/channel/UCxxxxxxxx
  const channelMatch = url.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/);
  if (channelMatch?.[1]) return channelMatch[1];

  // Try @handle format: youtube.com/@handle or just @handle
  const handleMatch = url.match(/(?:youtube\.com\/)?\@([A-Za-z0-9._-]+)/);
  if (handleMatch?.[1]) {
    const handle = handleMatch[1];
    return await extractChannelIdFromHandle(handle, apiKey);
  }

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

  const channelId = await extractChannelId(source.url, apiKey);
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
