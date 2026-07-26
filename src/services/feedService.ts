import { FeedData } from '../types';
import { FeedParser } from './feedParser';
import { SAMPLE_FEED_DATA } from '../data/sampleFeed';
import { logger } from '../utils/logger';

export class FeedService {
  /**
   * Loads the local sample feed or fetches a remote feed from a given URL.
   */
  static async loadFeed(feedUrl?: string): Promise<FeedData> {
    const targetUrl = feedUrl?.trim();

    if (!targetUrl || targetUrl === 'local' || targetUrl === '/feeds/sample-feed.json') {
      logger.info('FeedService', 'Loading default local sample feed');
      return SAMPLE_FEED_DATA;
    }

    logger.info('FeedService', `Initiating HTTP fetch request to: ${targetUrl}`);

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      logger.info('FeedService', 'HTTP feed payload downloaded successfully. Passing to parser.');
      
      const parsedFeed = FeedParser.parseFeed(json);
      
      if (!parsedFeed.videos || parsedFeed.videos.length === 0) {
        logger.warn('FeedService', 'Remote feed returned 0 playable videos. Falling back to sample feed.');
        return SAMPLE_FEED_DATA;
      }

      return parsedFeed;
    } catch (err) {
      logger.error('FeedService', `Failed to load remote feed from ${targetUrl}`, String(err));
      throw new Error(`Feed Service Network Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
