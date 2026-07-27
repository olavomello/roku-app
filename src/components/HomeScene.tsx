import React, { useRef } from 'react';
import { Video, PlaybackState } from '../types';
import { Play, Clock, Sparkles, Tag } from 'lucide-react';
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

  const showRating = focusedVideo?.rating && focusedVideo.rating !== 'NR';
  const thumbLabel = (video: Video) => {
    if (video.rating && video.rating !== 'NR') return video.rating;
    if (video.releaseDate) return video.releaseDate;
    return null;
  };

  return (
    <div className="flex flex-col h-full w-full px-4 sm:px-6 py-4 text-white">
      {/* Filtro de categorias */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
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
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
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

      {/* Spotlight do item focado — topo, largura total */}
      {focusedVideo && (
        <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#140e24] via-[#1a122e] to-[#0d0918] border border-purple-900/40 p-5 sm:p-6 shadow-2xl mb-5 overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#662D91]/10 blur-3xl pointer-events-none rounded-full" />

          {/* Poster */}
          <div className="relative w-full sm:w-48 h-32 sm:h-28 rounded-xl overflow-hidden border border-purple-800/40 shadow-xl shrink-0">
            <img
              src={focusedVideo.thumbnail}
              alt={focusedVideo.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574063413132-355dbfd83e0c?w=800'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          {/* Detalhes */}
          <div className="flex-1 min-w-0 z-10">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#662D91]/40 border border-purple-500/40 text-purple-300 text-[11px] font-bold rounded-full">
                <Sparkles className="w-3 h-3" />
                Spotlight
              </span>
              {focusedVideo.category && (
                <span className="px-2 py-0.5 bg-purple-950/60 text-purple-200 text-[11px] rounded border border-purple-800/40">
                  {focusedVideo.category}
                </span>
              )}
              {showRating && (
                <span className="px-2 py-0.5 bg-[#2a1d45] text-purple-300 text-[11px] font-bold rounded border border-purple-700/40">
                  {focusedVideo.rating}
                </span>
              )}
              {focusedVideo.releaseDate && (
                <span className="text-gray-400 text-[11px] font-mono">{focusedVideo.releaseDate}</span>
              )}
            </div>

            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight mb-1 line-clamp-1">
              {focusedVideo.title}
            </h1>
            <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3">
              {focusedVideo.description || 'Nenhuma sinopse disponivel.'}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onSelectVideo(focusedVideo)}
                className="px-5 py-2.5 bg-[#662D91] hover:bg-[#8034be] text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span className="text-xs">Watch (Enter)</span>
              </button>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-[#1e172e] px-3 py-2 rounded-xl border border-purple-900/40">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>{formatDuration(focusedVideo.duration)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grade de videos — largura total */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2">
          <span>Catalog</span>
          <span className="text-xs font-normal text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/40">
            {videos.length} titles
          </span>
        </h2>
        <div className="text-xs text-gray-500 hidden sm:block">
          Use keyboard arrows to navigate
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[#140e21] rounded-2xl border border-purple-900/30 text-center">
          <p className="text-gray-400 text-sm">No videos found in category "{selectedCategory}"</p>
          <button
            onClick={() => onSelectCategory('All')}
            className="mt-4 px-4 py-2 bg-[#662D91] hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
          >
            Show All
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 overflow-y-auto pb-6">
          {videos.map((video, idx) => {
            const isFocused = idx === focusedIndex;
            const history = playbackHistory[video.id];
            const progress = history && history.duration > 0 ? (history.currentTime / history.duration) * 100 : 0;
            const badge = thumbLabel(video);

            return (
              <motion.div
                key={video.id}
                ref={isFocused ? focusedItemRef : null}
                onClick={() => { setFocusedIndex(idx); onSelectVideo(video); }}
                onMouseEnter={() => setFocusedIndex(idx)}
                whileHover={{ scale: 1.03 }}
                className={`relative group rounded-xl overflow-hidden cursor-pointer transition-all duration-200 bg-[#161024] flex flex-col border-2 ${
                  isFocused
                    ? 'border-[#9e46ea] shadow-xl shadow-purple-900/40 ring-4 ring-purple-500/30 scale-[1.03] z-10'
                    : 'border-[#231a38] hover:border-purple-800/60'
                }`}
              >
                {/* Poster */}
                <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574063413132-355dbfd83e0c?w=800'; }}
                  />

                  {isFocused && (
                    <div className="absolute inset-0 bg-gradient-to-t from-[#662D91]/70 via-transparent to-transparent flex items-end p-2">
                      <div className="w-7 h-7 rounded-full bg-[#9e46ea] text-white flex items-center justify-center shadow-lg ml-auto animate-pulse">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Duracao */}
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white font-mono text-[10px] rounded backdrop-blur-sm">
                    {formatDuration(video.duration)}
                  </span>

                  {/* Rating ou ano — so se tiver valor diferente de NR */}
                  {badge && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-purple-950/90 text-purple-300 text-[10px] font-bold rounded border border-purple-800/50">
                      {badge}
                    </span>
                  )}

                  {progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                      <div className="h-full bg-purple-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2 flex flex-col flex-1">
                  <h3 className={`font-semibold text-xs line-clamp-1 ${isFocused ? 'text-white font-bold' : 'text-gray-200'}`}>
                    {video.title}
                  </h3>
                  <span className="text-[10px] text-gray-400 mt-0.5">{video.category || 'Geral'}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
