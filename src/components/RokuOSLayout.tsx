import React, { useRef, useMemo } from 'react';
import { Video, PlaybackState } from '../types';
import { Play, Clock, Sparkles, Tv, Search, Settings, Home, Grid } from 'lucide-react';
import { motion } from 'motion/react';
import { useAutoScrollFocus } from '../hooks/useAutoScrollFocus';

interface RokuOSLayoutProps {
  videos: Video[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  onSelectVideo: (video: Video) => void;
  playbackHistory: Record<string, PlaybackState>;
}

export const RokuOSLayout: React.FC<RokuOSLayoutProps> = ({
  videos,
  categories,
  selectedCategory,
  onSelectCategory,
  focusedIndex,
  setFocusedIndex,
  onSelectVideo,
  playbackHistory,
}) => {
  const focusedCardRef = useRef<HTMLDivElement>(null);

  // Group videos by category for Playlet-style RowList presentation
  const groupedCategories = useMemo(() => {
    if (selectedCategory !== 'All') {
      const catVideos = videos.filter((v) => v.category === selectedCategory);
      return [{ name: selectedCategory, videos: catVideos.length ? catVideos : videos }];
    }

    // Default: Group into rich multi-row categories
    const catMap: Record<string, Video[]> = {};
    videos.forEach((video) => {
      const cat = video.category || 'Destaques';
      if (!catMap[cat]) catMap[cat] = [];
      catMap[cat].push(video);
    });

    // Ensure 'Featured / Destaques' or 'All' comes first
    const result = [{ name: 'Todos os Vídeos (Destaques)', videos }];
    Object.keys(catMap).forEach((cat) => {
      result.push({ name: cat, videos: catMap[cat] });
    });
    return result;
  }, [videos, selectedCategory]);

  // Flattened video list for index calculation
  const currentVideoList = videos;
  const focusedVideo = currentVideoList[focusedIndex] || currentVideoList[0];

  // Auto-scroll focused video card into view smoothly ONLY on Keyboard / D-Pad Remote navigation
  useAutoScrollFocus(focusedIndex, focusedCardRef);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full h-full min-h-[820px] bg-[#090611] text-white flex flex-col justify-between relative overflow-hidden font-sans p-6 sm:p-8">
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#662D91]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* ════════════════════════════════════════════════════════════════
           TOP NAVIGATION BAR (Playlet Roku TV Style)
           TV Safe Margin: 80px horizontal
         ════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between mb-6 border-b border-purple-900/30 pb-4 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#662D91] flex items-center justify-center text-white shadow-md shadow-purple-900/50">
              <Tv className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-wide text-white">Roku OS TV</span>
            <span className="px-2 py-0.5 bg-purple-950/80 border border-purple-800/40 text-purple-300 text-[10px] font-mono rounded-full uppercase">
              Playlet Pattern
            </span>
          </div>

          {/* Categories Horizontal Tabs */}
          <div className="hidden lg:flex items-center gap-2 ml-4">
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-[#662D91] text-white ring-2 ring-purple-400 font-bold'
                    : 'bg-[#181129] text-gray-400 hover:text-white hover:bg-[#251b3e]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* TV Status & Remote Cue */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2 bg-[#161024] px-3 py-1.5 rounded-lg border border-purple-900/30">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Use D-Pad remote or Keyboard arrows</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
           HERO SPOTLIGHT BANNER (Playlet Focus Detail Banner)
           Updates automatically as D-Pad moves across videos!
         ════════════════════════════════════════════════════════════════ */}
      {focusedVideo && (
        <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#140e24] via-[#1a122e] to-[#0d0918] border border-purple-900/40 p-6 sm:p-8 shadow-2xl mb-8 overflow-hidden z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Spotlight Left Text Details */}
          <div className="flex-1 max-w-2xl z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 bg-[#662D91]/40 border border-purple-500/40 text-purple-300 text-[11px] font-bold rounded">
                Destaque
              </span>
              {focusedVideo.category && (
                <span className="px-2.5 py-0.5 bg-purple-950/70 border border-purple-800/40 text-purple-200 text-[11px] font-semibold rounded">
                  {focusedVideo.category}
                </span>
              )}
              {focusedVideo.rating && (
                <span className="px-2 py-0.5 bg-[#2a1d45] text-purple-300 text-[11px] font-bold rounded border border-purple-700/40">
                  {focusedVideo.rating}
                </span>
              )}
              {focusedVideo.releaseDate && (
                <span className="text-gray-400 text-xs font-mono">{focusedVideo.releaseDate}</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-3">
              {focusedVideo.title}
            </h1>

            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed line-clamp-3 mb-6">
              {focusedVideo.description || 'Nenhuma sinopse disponível para este título.'}
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => onSelectVideo(focusedVideo)}
                className="px-6 py-3 bg-[#662D91] hover:bg-[#8034be] text-white font-bold rounded-xl flex items-center gap-2.5 shadow-xl shadow-purple-950/90 ring-4 ring-purple-500/30 transition transform active:scale-95"
              >
                <Play className="w-5 h-5 fill-current text-white" />
                <span className="text-sm">Assistir (OK / Enter)</span>
              </button>

              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-[#1e172e] px-3.5 py-2 rounded-xl border border-purple-900/40">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>{formatDuration(focusedVideo.duration)}</span>
              </div>
            </div>
          </div>

          {/* Spotlight Right Backdrop Preview */}
          <div className="relative w-full lg:w-[420px] h-52 sm:h-60 rounded-xl overflow-hidden border border-purple-800/40 shadow-2xl shrink-0 group">
            <img
              src={focusedVideo.thumbnail}
              alt={focusedVideo.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#140e24] via-transparent to-transparent" />
            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 text-purple-200 text-[10px] font-mono rounded backdrop-blur-md">
              Roku Video Player Target
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
           ROKU SCENEGRAPH ROWLIST SECTION (Categories Horizontal Rows)
         ════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col space-y-6 overflow-y-auto pr-1 pb-8 z-10 scrollbar-none">
        {groupedCategories.map((group, groupIdx) => (
          <div key={group.name} className="flex flex-col">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#662D91]" />
              <span>{group.name}</span>
            </h2>

            <div className="flex items-center gap-4 overflow-x-auto pb-3 pt-1 px-1 scrollbar-none">
              {group.videos.map((video) => {
                const globalIndex = currentVideoList.findIndex((v) => v.id === video.id);
                const isFocused = globalIndex === focusedIndex;
                const history = playbackHistory[video.id];
                const progress = history && history.duration > 0 ? (history.currentTime / history.duration) * 100 : 0;

                return (
                  <motion.div
                    key={`${group.name}-${video.id}`}
                    ref={isFocused ? focusedCardRef : null}
                    onClick={() => {
                      setFocusedIndex(globalIndex);
                      onSelectVideo(video);
                    }}
                    onMouseEnter={() => setFocusedIndex(globalIndex)}
                    whileHover={{ scale: 1.03 }}
                    className={`relative w-[260px] sm:w-[280px] shrink-0 rounded-xl overflow-hidden cursor-pointer bg-[#150f24] border-2 transition-all duration-200 flex flex-col ${
                      isFocused
                        ? 'border-[#9e46ea] ring-4 ring-purple-500/40 shadow-2xl shadow-purple-950 scale-[1.03] z-20'
                        : 'border-[#231a38] opacity-80 hover:opacity-100 hover:border-purple-800'
                    }`}
                  >
                    {/* Card Poster Image */}
                    <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574063413132-355dbfd83e0c?w=800';
                        }}
                      />

                      {/* Roku OS Focus Ring Accent */}
                      {isFocused && (
                        <div className="absolute inset-0 bg-gradient-to-t from-[#662D91]/80 via-transparent to-transparent flex items-end justify-between p-2.5">
                          <span className="text-[10px] font-bold text-purple-200 bg-purple-950/90 px-2 py-0.5 rounded border border-purple-400">
                            Foco D-Pad
                          </span>
                          <div className="w-7 h-7 rounded-full bg-[#9e46ea] text-white flex items-center justify-center shadow-lg">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </div>
                        </div>
                      )}

                      {/* Duration Tag */}
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white font-mono text-[10px] rounded">
                        {formatDuration(video.duration)}
                      </span>

                      {/* Continue Watching Bar */}
                      {progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                          <div className="h-full bg-purple-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                      )}
                    </div>

                    {/* Card Title & Info */}
                    <div className="p-3 flex flex-col justify-between flex-1">
                      <h3 className={`font-semibold text-xs line-clamp-1 ${isFocused ? 'text-white font-bold' : 'text-gray-300'}`}>
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-400">
                        <span>{video.category || 'Geral'}</span>
                        {video.artist && <span className="text-purple-300 truncate max-w-[100px]">{video.artist}</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
