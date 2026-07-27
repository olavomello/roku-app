import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Video, PlaybackState } from '../types';
import {
  Play,
  Pause,
  FastForward,
  Rewind,
  Volume2,
  VolumeX,
  ArrowLeft,
  Info,
  AlertCircle,
  Maximize,
  Minimize
} from 'lucide-react';
import { logger } from '../utils/logger';

interface PlayerSceneProps {
  video: Video;
  onBack: () => void;
  onUpdatePlayback: (videoId: string, currentTime: number, duration: number, completed: boolean) => void;
  initialTime?: number;
}

export const PlayerScene: React.FC<PlayerSceneProps> = ({
  video,
  onBack,
  onUpdatePlayback,
  initialTime = 0
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(video.duration || 0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showOSD, setShowOSD] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const osdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetOSDTimer = useCallback(() => {
    setShowOSD(true);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowOSD(false);
      }
    }, 4000);
  }, [isPlaying]);

  useEffect(() => {
    logger.info('PlayerScene', `Initialized video player for '${video.title}' (URL: ${video.url})`);
    resetOSDTimer();

    return () => {
      if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    };
  }, [video, resetOSDTimer]);

  // Set initial seek time on metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || video.duration || 0);
      if (initialTime > 0 && initialTime < (videoRef.current.duration - 5)) {
        videoRef.current.currentTime = initialTime;
        logger.info('PlayerScene', `Resumed playback from position ${Math.floor(initialTime)}s`);
      }
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        logger.warn('PlayerScene', 'Auto-play blocked or delayed', String(err));
        setIsPlaying(false);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || duration;
      setCurrentTime(cur);
      onUpdatePlayback(video.id, cur, dur, cur >= dur - 1);
    }
  };

  const togglePlayPause = () => {
    resetOSDTimer();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        logger.info('PlayerScene', 'Playback paused by user');
      } else {
        videoRef.current.play();
        setIsPlaying(true);
        logger.info('PlayerScene', 'Playback resumed');
      }
    }
  };

  const handleSeekRelative = (seconds: number) => {
    resetOSDTimer();
    if (videoRef.current) {
      const target = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
      videoRef.current.currentTime = target;
      setCurrentTime(target);
      logger.info('PlayerScene', `Seeked ${seconds > 0 ? '+' : ''}${seconds}s to ${Math.floor(target)}s`);
    }
  };

  const handleSeekToProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetOSDTimer();
    const target = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const toggleMute = () => {
    resetOSDTimer();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const [currentStreamUrl, setCurrentStreamUrl] = useState<string>(video.url);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);

  const FALLBACK_MIRRORS = [
    video.url,
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_1mb.mp4'
  ];

  useEffect(() => {
    setCurrentStreamUrl(video.url);
    setHasError(false);
    setErrorMessage('');
    setRetryAttempt(0);
  }, [video]);

  const handleVideoError = () => {
    const err = videoRef.current?.error;
    const code = err?.code;
    const msg = err ? `Video Error Code ${code}: ${err.message || 'MEDIA_ELEMENT_ERROR'}` : 'Failed to stream media source';
    logger.error('PlayerScene', msg, { videoId: video.id, url: currentStreamUrl });

    // Try next fallback stream if available and not already attempted
    const nextAttempt = retryAttempt + 1;
    if (nextAttempt < FALLBACK_MIRRORS.length && FALLBACK_MIRRORS[nextAttempt] !== currentStreamUrl) {
      logger.info('PlayerScene', `Auto-switching to stream mirror #${nextAttempt}`);
      setRetryAttempt(nextAttempt);
      setCurrentStreamUrl(FALLBACK_MIRRORS[nextAttempt]);
      setHasError(false);
    } else {
      setHasError(true);
      setErrorMessage(msg);
    }
  };

  const handleManualRetry = () => {
    setHasError(false);
    setErrorMessage('');
    const nextIndex = (retryAttempt + 1) % FALLBACK_MIRRORS.length;
    setRetryAttempt(nextIndex);
    setCurrentStreamUrl(FALLBACK_MIRRORS[nextIndex]);
    logger.info('PlayerScene', `Manual stream retry requested. Trying stream index ${nextIndex}`);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none"
      onMouseMove={resetOSDTimer}
      onClick={resetOSDTimer}
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        src={currentStreamUrl}
        poster={video.thumbnail}
        className="w-full h-full object-contain"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onError={handleVideoError}
        onEnded={() => {
          logger.info('PlayerScene', 'Video playback completed');
          setIsPlaying(false);
          setShowOSD(true);
        }}
        playsInline
      />

      {/* Erro de stream */}
      {hasError && (
        <div className="absolute inset-0 bg-[#100c19]/95 flex flex-col items-center justify-center p-8 text-center z-40">
          <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-500 text-red-400 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Stream indisponivel</h2>
          <p className="text-gray-300 text-xs max-w-md mb-6">{errorMessage}</p>
          <div className="flex items-center gap-4">
            <button
              onClick={handleManualRetry}
              className="px-6 py-2.5 bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition border border-purple-500/40"
            >
              Tentar novamente
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-[#662D91] hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition"
            >
              Voltar ao catalogo
            </button>
          </div>
        </div>
      )}

      {/* Fade topo — sempre visivel para parecer tela cheia */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />

      {/* Botao voltar + titulo — aparece/some com OSD */}
      <div className={`absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-5 z-20 transition-opacity duration-300 ${showOSD || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1426]/90 hover:bg-[#662D91] text-white text-xs font-bold rounded-xl border border-purple-500/30 transition shadow-lg backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar (Esc)</span>
        </button>
        <h1 className="text-base font-bold text-white tracking-wide drop-shadow-lg">{video.title}</h1>
      </div>

      {/* Centro — botao play grande quando pausado */}
      {!isPlaying && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <button
            onClick={togglePlayPause}
            className="w-20 h-20 rounded-full bg-[#662D91]/90 hover:bg-[#8034be] text-white flex items-center justify-center shadow-2xl border-2 border-purple-400/50 transition transform hover:scale-110 active:scale-95"
          >
            <Play className="w-8 h-8 fill-current ml-1" />
          </button>
        </div>
      )}

      {/* Fade inferior + controles — aparece/some com OSD */}
      <div className={`absolute inset-x-0 bottom-0 z-20 transition-opacity duration-300 ${showOSD || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-12 px-6 pb-6">
          <div className="space-y-3 bg-[#100c19]/80 border border-purple-900/40 p-4 rounded-2xl backdrop-blur-md shadow-2xl">
            {/* Barra de progresso */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeekToProgress}
                className="w-full h-2 bg-purple-950 rounded-lg appearance-none cursor-pointer accent-[#9e46ea]"
              />
              <div className="flex justify-between text-[11px] font-mono text-gray-300">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime((duration || 0) - currentTime)}</span>
              </div>
            </div>

            {/* Botoes de controle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSeekRelative(-10)}
                  className="p-2.5 bg-[#2d2442] hover:bg-[#662D91] text-purple-200 rounded-xl transition"
                  title="Voltar 10s"
                >
                  <Rewind className="w-4 h-4 fill-current" />
                </button>

                <button
                  onClick={togglePlayPause}
                  className="px-5 py-2.5 bg-[#662D91] hover:bg-[#8034be] text-white rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-md"
                >
                  {isPlaying ? (
                    <><Pause className="w-4 h-4 fill-current" /><span>Pausar</span></>
                  ) : (
                    <><Play className="w-4 h-4 fill-current" /><span>Reproduzir</span></>
                  )}
                </button>

                <button
                  onClick={() => handleSeekRelative(10)}
                  className="p-2.5 bg-[#2d2442] hover:bg-[#662D91] text-purple-200 rounded-xl transition"
                  title="Avancar 10s"
                >
                  <FastForward className="w-4 h-4 fill-current" />
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-300 bg-[#1c152d] px-3 py-1.5 rounded-lg border border-purple-900/40">
                <Info className="w-3.5 h-3.5 text-purple-400" />
                <span className="line-clamp-1 max-w-xs">{video.description || video.category}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2.5 bg-[#2d2442] hover:bg-[#662D91] text-purple-200 rounded-xl transition"
                  title={isMuted ? 'Ativar som' : 'Silenciar'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* Botao fullscreen — canto inferior direito */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2.5 bg-[#2d2442] hover:bg-[#662D91] text-purple-200 rounded-xl transition"
                  title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
