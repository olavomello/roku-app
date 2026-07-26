import { describe, it, expect } from 'vitest';
import { FeedParser } from '../services/feedParser';

describe('FeedParser Unit Tests', () => {
  it('should parse simple MVP videos array format', () => {
    const rawFeed = {
      videos: [
        {
          id: 'v1',
          title: 'Test Video 1',
          thumbnail: 'https://example.com/thumb.jpg',
          url: 'https://example.com/stream.mp4',
          description: 'A test video description',
          category: 'Action'
        }
      ]
    };

    const parsed = FeedParser.parseFeed(rawFeed);
    expect(parsed.videos).toHaveLength(1);
    expect(parsed.videos[0].id).toBe('v1');
    expect(parsed.videos[0].title).toBe('Test Video 1');
    expect(parsed.videos[0].category).toBe('Action');
    expect(parsed.categories).toContain('All');
    expect(parsed.categories).toContain('Action');
  });

  it('should parse root-level JSON array format', () => {
    const rawFeed = [
      {
        Title: 'Movie 1',
        Poster: 'https://example.com/poster.jpg',
        Url: 'https://example.com/movie1.mp4',
        Genre: 'Sci-Fi, Action'
      }
    ];

    const parsed = FeedParser.parseFeed(rawFeed);
    expect(parsed.videos).toHaveLength(1);
    expect(parsed.videos[0].title).toBe('Movie 1');
    expect(parsed.videos[0].category).toBe('Sci-Fi');
  });

  it('should parse official Roku Content Feed format', () => {
    const rokuFeed = {
      providerName: 'Test Roku Channel',
      movie: [
        {
          id: 'm1',
          title: 'Roku Movie 1',
          genres: ['Comedy'],
          content: {
            poster: 'https://example.com/movie_poster.jpg',
            videos: [
              { url: 'https://example.com/hls.m3u8', videoType: 'HLS' }
            ]
          }
        }
      ]
    };

    const parsed = FeedParser.parseFeed(rokuFeed);
    expect(parsed.videos).toHaveLength(1);
    expect(parsed.videos[0].title).toBe('Roku Movie 1');
    expect(parsed.videos[0].url).toBe('https://example.com/hls.m3u8');
    expect(parsed.videos[0].category).toBe('Comedy');
  });

  it('should throw error for invalid JSON or non-object feed', () => {
    expect(() => FeedParser.parseFeed('invalid json string {')).toThrow('Invalid JSON feed format');
    expect(() => FeedParser.parseFeed(12345)).toThrow('Feed data must be an object or JSON string');
  });
});
