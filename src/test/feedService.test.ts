import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedService } from '../services/feedService';
import { SAMPLE_FEED_DATA } from '../data/sampleFeed';

describe('FeedService Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return default sample feed when no URL or "local" is provided', async () => {
    const feed = await FeedService.loadFeed('local');
    expect(feed.videos.length).toBeGreaterThan(0);
    expect(feed.providerName).toBe(SAMPLE_FEED_DATA.providerName);
  });

  it('should fetch and parse remote feed successfully', async () => {
    const mockRemoteJson = {
      videos: [
        {
          id: 'rem-1',
          title: 'Remote Video 1',
          thumbnail: 'https://example.com/thumb.jpg',
          url: 'https://example.com/video.mp4',
        }
      ]
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRemoteJson,
    } as Response));

    const feed = await FeedService.loadFeed('https://api.mychannel.com/feed.json');
    expect(feed.videos).toHaveLength(1);
    expect(feed.videos[0].title).toBe('Remote Video 1');
  });

  it('should throw error when fetch fails with HTTP error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response));

    await expect(FeedService.loadFeed('https://api.mychannel.com/invalid.json')).rejects.toThrow(
      'Feed Service Network Error: HTTP 404: Not Found'
    );
  });
});
