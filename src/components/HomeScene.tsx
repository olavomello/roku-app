import React, { useRef } from 'react';
import { Video, PlaybackState } from '../types';
import { Play, Clock, Star, Sparkles, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { useAutoScrollFocus } from '../hooks/useAutoScrollFocus';

interface HomeSceneProps {
  videos: Video[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  onSelectVideo: (video: Video) => void;
  playbackHistory: Record<string, PlaybackState>;
}

export const HomeScene: React.FC<HomeSceneProps> = ({
  videos,
  categories,
  selectedCategory,
  onSelectCategory,
  focusedIndex,
  setFocusedIndex,
  onSelectVideo,
  playbackHistory
}) => {
  const focusedItemRef = useRef<HTMLDivElement>(null);

  // Auto-scroll focused video item into view ONLY when navigating via Keyboard or Remote D-Pad
  useAutoScrollFocus(focusedIndex, focusedItemRef);

  const focusedVideo = videos[focusedIndex] || videos[0];

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto px-6 py-4 text-white">
      {/* Category Pills Header */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs text-purple-300 font-bold uppercase tracking-wider mr-2 shrink-0">
          <Tag className="w-3.5 h-3.5" />
          <span>Categories:</span>
        </div>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-[#662D91] text-white shadow-lg shadow-purple-900/50 ring-2 ring-purple-400'
                  : 'bg-[#1a1426] text-gray-300 hover:bg-[#2d2442] hover:text-white'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Main Grid + Spotlight Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        {/* Left Column: Video Poster Grid */}
        <div className="lg:col-span-8 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-200 tracking-wide flex items-center gap-2">
              <span>Channel Catalog</span>
              <span className="text-xs font-normal text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/40">
                {videos.length} Titles
              </span>
            </h2>
            <div className="text-xs text-gray-400 hidden sm:block">
              Use <kbd className="px-1.5 py-0.5 bg-[#2d2442] border border-purple-500/30 rounded text-purple-200">▲</kbd> <kbd className="px-1.5 py-0.5 bg-[#2d2442] border border-purple-500/30 rounded text-purple-200">▼</kbd> <kbd className="px-1.5 py-0.5 bg-[#2d2442] border border-purple-500/30 rounded text-purple-200">◄</kbd> <kbd className="px-1.5 py-0.5 bg-[#2d2442] border border-purple-500/30 rounded text-purple-200">►</kbd> or click to focus
            </div>
          </div>

          {videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-[#140e21] rounded-2xl border border-purple-900/30 text-center">
              <p className="text-gray-400 text-sm">No videos found in category "{selectedCategory}"</p>
              <button
                onClick={() => onSelectCategory('All')}
                className="mt-4 px-4 py-2 bg-[#662D91] hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
              >
                Show All Videos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto pr-2 min-h-0 pb-12">
              {videos.map((video, idx) => {
                const isFocused = idx === focusedIndex;
                const history = playbackHistory[video.id];
                const progress = history && history.duration > 0 ? (history.currentTime / history.duration) * 100 : 0;

                return (
                  <motion.div
                    key={video.id}
                    ref={isFocused ? focusedItemRef : null}
                    onClick={() => {
                      setFocusedIndex(idx);
                      onSelectVideo(video);
                    }}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    whileHover={{ scale: 1.02 }}
                    className={`relative group rounded-xl overflow-hidden cursor-pointer transition-all duration-200 bg-[#161024] flex flex-col border-2 ${
                      isFocused
                        ? 'border-[#9e46ea] shadow-xl shadow-purple-900/40 ring-4 ring-purple-500/30 scale-[1.02] z-10'
                        : 'border-[#231a38] hover:border-purple-800/60'
                    }`}
                  >
                    {/* Poster Image */}
                    <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback thumbnail if image breaks
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574063413132-355dbfd83e0c?w=800';
                        }}
                      />

                      {/* Roku OS Focus Overlay Indicator */}
                      {isFocused && (
                        <div className="absolute inset-0 bg-gradient-to-t from-[#662D91]/70 via-transparent to-transparent flex items-end p-2">
                          <div className="w-8 h-8 rounded-full bg-[#9e46ea] text-white flex items-center justify-center shadow-lg ml-auto mb-1 animate-pulse">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                      )}

                      {/* Duration Tag */}
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white font-mono text-[10px] rounded backdrop-blur-sm">
                        {formatDuration(video.duration)}
                      </span>

                      {/* Rating Badge */}
                      {video.rating && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-purple-950/90 text-purple-300 text-[10px] font-bold rounded border border-purple-800/50">
                          {video.rating}
                        </span>
                      )}

                      {/* Progress Bar (Continue Watching) */}
                      {progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Card Title Info */}
                    <div className="p-3 flex flex-col justify-between flex-1">
                      <h3 className={`font-semibold text-xs line-clamp-1 transition-colors ${
                        isFocused ? 'text-white font-bold' : 'text-gray-200'
                      }`}>
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400">
                        <span>{video.category || 'General'}</span>
                        {video.artist && <span className="line-clamp-1 max-w-[100px] text-purple-300">{video.artist}</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Focused Item Details (Roku Spotlight HUD) */}
        {focusedVideo && (
          <div className="lg:col-span-4 flex flex-col justify-between bg-[#150f22] border border-[#2d2147] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#662D91]/15 blur-3xl pointer-events-none rounded-full" />

            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#662D91]/30 border border-purple-500/40 text-purple-300 text-xs font-bold rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Roku Focused Item
                </span>
                <span className="text-xs text-gray-400 font-mono">ID: {focusedVideo.id}</span>
              </div>

              {/* Big Title */}
              <h1 className="text-2xl font-bold text-white tracking-tight mb-2 leading-tight">
                {focusedVideo.title}
              </h1>

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                {focusedVideo.rating && (
                  <span className="px-2 py-0.5 bg-[#2d2442] border border-purple-500/30 text-purple-200 font-bold rounded">
                    {focusedVideo.rating}
                  </span>
                )}
                <span className="flex items-center gap-1 text-gray-300 bg-[#1c152d] px-2.5 py-0.5 rounded border border-purple-900/30">
                  <Clock className="w-3 h-3 text-purple-400" />
                  {formatDuration(focusedVideo.duration)}
                </span>
                {focusedVideo.releaseDate && (
                  <span className="text-gray-400 font-medium px-2 py-0.5 bg-[#1c152d] rounded border border-purple-900/30">
                    {focusedVideo.releaseDate}
                  </span>
                )}
                {focusedVideo.category && (
                  <span className="text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded font-medium border border-purple-800/40">
                    {focusedVideo.category}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-300 text-xs leading-relaxed mb-6 line-clamp-6">
                {focusedVideo.description || 'No detailed synopsis available for this title.'}
              </p>

              {/* Artist / Provider */}
              {focusedVideo.artist && (
                <div className="mb-6 p-3 bg-[#1c152d] rounded-xl border border-purple-900/40">
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mb-0.5">Creator / Studio</span>
                  <span className="text-xs text-gray-200 font-semibold">{focusedVideo.artist}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-[#2a1d42]">
              <button
                onClick={() => onSelectVideo(focusedVideo)}
                className="w-full py-3.5 px-6 bg-[#662D91] hover:bg-[#8034be] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-purple-950/80 active:scale-98 group"
              >
                <Play className="w-5 h-5 fill-current text-white group-hover:scale-110 transition-transform" />
                <span>Play Stream (Press OK / Enter)</span>
              </button>

              <p className="text-[11px] text-gray-400 text-center">
                Press <kbd className="px-1 py-0.5 bg-[#2d2442] border border-purple-500/30 rounded text-purple-200">Enter</kbd> or <kbd className="px-1 py-0.5 bg-[#2d2442] border border-purple-500/30 rounded text-purple-200">OK</kbd> on remote to start playback
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
