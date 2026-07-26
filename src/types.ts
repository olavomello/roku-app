export interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  url: string;
  duration?: number; // in seconds
  category?: string;
  releaseDate?: string;
  rating?: string;
  artist?: string;
}

export interface FeedData {
  providerName?: string;
  lastUpdated?: string;
  language?: string;
  videos: Video[];
  categories?: string[];
}

export type SceneType = 'HOME' | 'PLAYER' | 'FEED_INSPECTOR';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  details?: Record<string, unknown> | string;
}

export interface PlaybackState {
  videoId: string;
  currentTime: number;
  duration: number;
  completed: boolean;
  lastWatchedAt: number;
}
