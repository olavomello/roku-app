import React, { useState, useEffect, useCallback } from 'react';
import { Video, FeedData, SceneType, PlaybackState } from '../types';
import { FeedService } from '../services/feedService';
import { HomeScene } from './HomeScene';
import { PlayerScene } from './PlayerScene';
import { FeedInspector } from './FeedInspector';
import { ErrorScreen } from './ErrorScreen';
import { RokuRemote } from './RokuRemote';
import { Navbar } from './Navbar';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

export const MainScene: React.FC = () => {
  const [currentScene, setCurrentScene] = useState<SceneType>('HOME');
  const [feedData, setFeedData] = useState<FeedData | null>(null);
  const [feedUrl, setFeedUrl] = useState<string>('/feeds/sample-feed.json');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isRemoteOpen, setIsRemoteOpen] = useState<boolean>(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Playback positions history (localStorage)
  const [playbackHistory, setPlaybackHistory] = useState<Record<string, PlaybackState>>(() => {
    try {
      const saved = localStorage.getItem('roku_playback_history');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Load Feed Data Task
  const fetchFeed = useCallback(async (url: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    logger.info('MainScene', `Loading feed from URL: ${url}`);

    try {
      const data = await FeedService.loadFeed(url);
      setFeedData(data);
      setSelectedCategory('All');
      setFocusedIndex(0);
      setIsLoading(false);
      logger.info('MainScene', `Feed loaded successfully. Total videos: ${data.videos.length}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('MainScene', `Failed to load feed from ${url}`, msg);
      setErrorMsg(msg);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    logger.info('MainScene', 'Initializing Roku SceneGraph MainScene');
    fetchFeed(feedUrl);
  }, [fetchFeed, feedUrl]);

  // Filtered videos by category
  const filteredVideos = React.useMemo(() => {
    if (!feedData) return [];
    if (selectedCategory === 'All') return feedData.videos;
    return feedData.videos.filter((v) => v.category === selectedCategory);
  }, [feedData, selectedCategory]);

  // Navigation handlers
  const handleSelectVideo = (video: Video) => {
    logger.info('MainScene', `Navigating to PlayerScene for video: '${video.title}' (id: ${video.id})`);
    setSelectedVideo(video);
    setCurrentScene('PLAYER');
  };

  const handleBackToHome = () => {
    logger.info('MainScene', 'Returning to HomeScene. Restoring focus index.');
    setCurrentScene('HOME');
  };

  const handleUpdatePlayback = (videoId: string, currentTime: number, duration: number, completed: boolean) => {
    setPlaybackHistory((prev) => {
      const updated = {
        ...prev,
        [videoId]: {
          videoId,
          currentTime,
          duration,
          completed,
          lastWatchedAt: Date.now(),
        },
      };
      try {
        localStorage.setItem('roku_playback_history', JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  // D-Pad Navigation logic
  const handleDirection = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (currentScene !== 'HOME' || filteredVideos.length === 0) return;

    const total = filteredVideos.length;
    const cols = 3; // Grid columns on desktop

    setFocusedIndex((prev) => {
      let next = prev;

      if (direction === 'LEFT') {
        next = prev > 0 ? prev - 1 : prev;
      } else if (direction === 'RIGHT') {
        next = prev < total - 1 ? prev + 1 : prev;
      } else if (direction === 'UP') {
        next = prev - cols >= 0 ? prev - cols : prev;
      } else if (direction === 'DOWN') {
        next = prev + cols < total ? prev + cols : prev;
      }

      if (next !== prev) {
        logger.debug('MainScene', `D-Pad focus moved ${direction} to index ${next}`);
      }
      return next;
    });
  }, [currentScene, filteredVideos]);

  const handleSelectCurrent = useCallback(() => {
    if (currentScene === 'HOME' && filteredVideos[focusedIndex]) {
      handleSelectVideo(filteredVideos[focusedIndex]);
    }
  }, [currentScene, filteredVideos, focusedIndex]);

  // Global Keyboard listener (Arrow keys, Enter, Backspace, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user typing in input fields
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleDirection('UP');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleDirection('DOWN');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleDirection('LEFT');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleDirection('RIGHT');
          break;
        case 'Enter':
          e.preventDefault();
          handleSelectCurrent();
          break;
        case 'Escape':
        case 'Backspace':
          if (currentScene === 'PLAYER') {
            e.preventDefault();
            handleBackToHome();
          }
          break;
        case '*':
          e.preventDefault();
          setIsInspectorOpen((prev) => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDirection, handleSelectCurrent, currentScene]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0813] text-white font-sans antialiased selection:bg-[#662D91]">
      {/* Top Navigation HUD */}
      <Navbar
        currentScene={currentScene}
        onNavigateHome={handleBackToHome}
        onToggleRemote={() => setIsRemoteOpen((prev) => !prev)}
        onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
        isRemoteOpen={isRemoteOpen}
        channelTitle={feedData?.providerName || config.appName}
      />

      {/* Scene Body */}
      <main className="flex-1 flex flex-col relative min-h-0">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-14 h-14 border-4 border-purple-900 border-t-[#9e46ea] rounded-full animate-spin mb-4" />
            <p className="font-bold text-sm text-purple-200">Loading Roku Content Feed...</p>
            <p className="text-xs text-gray-400 mt-1">Executing LoadFeedTask node</p>
          </div>
        ) : errorMsg ? (
          <ErrorScreen
            message={errorMsg}
            onRetry={() => fetchFeed(feedUrl)}
            onResetFeed={() => {
              setFeedUrl('/feeds/sample-feed.json');
              fetchFeed('/feeds/sample-feed.json');
            }}
          />
        ) : currentScene === 'HOME' ? (
          <HomeScene
            videos={filteredVideos}
            categories={feedData?.categories || ['All']}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setFocusedIndex(0);
            }}
            focusedIndex={focusedIndex}
            setFocusedIndex={setFocusedIndex}
            onSelectVideo={handleSelectVideo}
            playbackHistory={playbackHistory}
          />
        ) : currentScene === 'PLAYER' && selectedVideo ? (
          <PlayerScene
            video={selectedVideo}
            onBack={handleBackToHome}
            onUpdatePlayback={handleUpdatePlayback}
            initialTime={playbackHistory[selectedVideo.id]?.currentTime || 0}
          />
        ) : null}
      </main>

      {/* Floating On-Screen Roku TV Remote */}
      <RokuRemote
        isOpen={isRemoteOpen}
        onClose={() => setIsRemoteOpen(false)}
        onDirection={handleDirection}
        onSelect={handleSelectCurrent}
        onBack={handleBackToHome}
        onHome={handleBackToHome}
        onPlayPause={handleSelectCurrent}
        onStar={() => setIsInspectorOpen(true)}
        onToggleInspector={() => setIsInspectorOpen(true)}
      />

      {/* Dev Feed Inspector Modal */}
      {isInspectorOpen && (
        <FeedInspector
          currentFeedUrl={feedUrl}
          onLoadFeedUrl={(url) => {
            setFeedUrl(url);
            fetchFeed(url);
          }}
          feedData={feedData}
          onClose={() => setIsInspectorOpen(false)}
        />
      )}
    </div>
  );
};
