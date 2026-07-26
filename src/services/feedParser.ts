import { FeedData, Video } from '../types';
import { logger } from '../utils/logger';

export class FeedParser {
  /**
   * Parses raw JSON objects or strings into normalized FeedData structure.
   * Handles both simple custom feeds and official Roku Content Feed JSON formats.
   */
  static parseFeed(rawData: unknown): FeedData {
    logger.info('FeedParser', 'Starting feed parsing and conversion to VideoModel nodes');

    let parsed: any;

    if (typeof rawData === 'string') {
      try {
        parsed = JSON.parse(rawData);
      } catch (err) {
        logger.error('FeedParser', 'Failed to parse raw JSON string', String(err));
        throw new Error('Invalid JSON feed format');
      }
    } else if (typeof rawData === 'object' && rawData !== null) {
      parsed = rawData;
    } else {
      logger.error('FeedParser', 'Invalid rawData type received', typeof rawData);
      throw new Error('Feed data must be an object or JSON string');
    }

    const videos: Video[] = [];

    // Format 0: Root-level Array `[ { Title, Poster, ... } ]`
    if (Array.isArray(parsed)) {
      logger.info('FeedParser', `Detected root-level JSON array with ${parsed.length} items`);
      parsed.forEach((item: Record<string, unknown>, index: number) => {
        const video = FeedParser.normalizeVideoItem(item, index);
        if (video) videos.push(video);
      });
    }
    // Format 1: Simple MVP format `{ "videos": [ { id, title, thumbnail, url } ] }`
    else if (Array.isArray(parsed.videos)) {
      logger.debug('FeedParser', `Detected simple videos array with ${parsed.videos.length} items`);
      parsed.videos.forEach((item: Record<string, unknown>, index: number) => {
        const video = FeedParser.normalizeVideoItem(item, index);
        if (video) videos.push(video);
      });
    } 
    // Format 2: Official Roku Content Feed format `{ "movie": [...], "series": [...], "shortFormVideos": [...] }`
    else if (Array.isArray(parsed.shortFormVideos) || Array.isArray(parsed.movie) || Array.isArray(parsed.tvSpecial)) {
      logger.info('FeedParser', 'Detected official Roku Content Feed schema');
      
      const rawMovies = (parsed.movie as Record<string, unknown>[]) || [];
      const rawShorts = (parsed.shortFormVideos as Record<string, unknown>[]) || [];
      const rawSpecials = (parsed.tvSpecial as Record<string, unknown>[]) || [];

      [...rawMovies, ...rawShorts, ...rawSpecials].forEach((item, index) => {
        const video = FeedParser.normalizeRokuContentFeedItem(item, index);
        if (video) videos.push(video);
      });
    } else {
      logger.warn('FeedParser', 'Unrecognized feed structure. Attempting fallback array search.');
      // Find first array property
      const keys = Object.keys(parsed);
      for (const k of keys) {
        if (Array.isArray(parsed[k])) {
          (parsed[k] as Record<string, unknown>[]).forEach((item, idx) => {
            const v = FeedParser.normalizeVideoItem(item, idx);
            if (v) videos.push(v);
          });
          break;
        }
      }
    }

    logger.info('FeedParser', `Successfully parsed ${videos.length} valid VideoModel items`);

    // Extract unique categories
    const categoriesSet = new Set<string>(['All']);
    videos.forEach((v) => {
      if (v.category) categoriesSet.add(v.category);
    });

    return {
      providerName: (parsed.providerName as string) || (parsed.title as string) || 'Roku Channel',
      lastUpdated: (parsed.lastUpdated as string) || new Date().toISOString(),
      videos,
      categories: Array.from(categoriesSet),
    };
  }

  private static normalizeVideoItem(item: Record<string, unknown>, index: number): Video | null {
    if (!item) return null;

    const id = String(item.id || item.imdbID || item.guid || `vid-${index + 1}`);
    const title = String(item.title || item.Title || item.name || `Video #${index + 1}`);
    
    // Support capitalized Poster / Images or lowercase poster / thumbnail
    let thumbnail = String(
      item.thumbnail || item.poster || item.Poster || item.imageUrl || item.image || ''
    );
    if (!thumbnail && Array.isArray(item.Images) && item.Images.length > 0) {
      thumbnail = String(item.Images[0]);
    }
    if (!thumbnail) {
      thumbnail = 'https://images.unsplash.com/photo-1574063413132-355dbfd83e0c?w=800';
    }

    // Stream URL
    let url = String(item.url || item.streamUrl || item.contentUrl || item.Url || item.StreamUrl || '');
    if (!url) {
      // Sample MP4 fallback streams for movie feeds without stream URLs
      const sampleStreams = [
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
      ];
      url = sampleStreams[index % sampleStreams.length];
      logger.info('FeedParser', `Assigned fallback stream URL for '${title}'`);
    }

    const description = String(item.description || item.Plot || item.plot || item.summary || 'No description provided.');
    
    // Parse runtime or duration e.g., "162 min" -> 162 * 60
    let duration = 120;
    if (typeof item.duration === 'number') {
      duration = item.duration;
    } else if (typeof item.Runtime === 'string') {
      const match = item.Runtime.match(/(\d+)/);
      if (match) duration = parseInt(match[1], 10) * 60;
    }

    // Category / Genre
    let category = 'General';
    if (item.category) category = String(item.category);
    else if (item.Genre) {
      const g = String(item.Genre).split(',')[0].trim();
      if (g) category = g;
    } else if (item.genre) category = String(item.genre);

    const rating = String(item.rating || item.Rated || 'G');
    const releaseDate = String(item.releaseDate || item.Year || item.Released || '');
    const artist = String(item.artist || item.Director || item.Writer || item.Actors || '');

    return {
      id,
      title,
      description,
      thumbnail,
      url,
      duration,
      category,
      releaseDate: releaseDate || undefined,
      rating: rating || 'G',
      artist: artist || undefined,
    };
  }

  private static normalizeRokuContentFeedItem(item: Record<string, unknown>, index: number): Video | null {
    if (!item) return null;

    const id = String(item.id || `roku-item-${index}`);
    const title = String(item.title || 'Untitled Roku Stream');
    
    // Extract thumbnail from content.poster / thumbnail
    let thumbnail = 'https://images.unsplash.com/photo-1574063413132-355dbfd83e0c?w=800';
    if (item.thumbnail) {
      thumbnail = String(item.thumbnail);
    } else if (item.content && typeof item.content === 'object') {
      const content = item.content as Record<string, unknown>;
      if (content.poster) thumbnail = String(content.poster);
    }

    // Extract stream video URL
    let url = '';
    if (item.content && typeof item.content === 'object') {
      const content = item.content as Record<string, unknown>;
      if (Array.isArray(content.videos) && content.videos.length > 0) {
        url = String((content.videos[0] as Record<string, unknown>).url || '');
      } else if (content.url) {
        url = String(content.url);
      }
    } else if (item.url) {
      url = String(item.url);
    }

    if (!url) return null;

    return {
      id,
      title,
      description: String(item.shortDescription || item.longDescription || 'Roku Channel Feature'),
      thumbnail,
      url,
      duration: typeof item.duration === 'number' ? item.duration : 300,
      category: Array.isArray(item.genres) ? String(item.genres[0]) : 'Roku Video',
      rating: item.rating ? String((item.rating as Record<string, unknown>).rating || 'G') : 'G',
    };
  }
}
