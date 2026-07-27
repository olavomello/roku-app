import React, { useState, useEffect } from 'react';
import { Tv, Wifi, WifiOff, Code, ChevronRight, Sparkles, Download } from 'lucide-react';
import { SceneType } from '../types';
import { config } from '../utils/config';

interface NavbarProps {
  currentScene: SceneType;
  onNavigateHome: () => void;
  onToggleRemote: () => void;
  onToggleInspector: () => void;
  isRemoteOpen: boolean;
  channelTitle?: string;
  layoutMode?: 'web' | 'roku';
  onToggleLayoutMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScene,
  onNavigateHome,
  onToggleRemote,
  onToggleInspector,
  isRemoteOpen,
  channelTitle = config.appName,
  layoutMode = 'web',
  onToggleLayoutMode
}) => {
  const [time, setTime] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Monitor de conectividade via eventos do navegador
  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="w-full bg-[#120d1c]/90 border-b border-[#2a1d42] px-6 py-3.5 flex items-center justify-between text-white backdrop-blur-md sticky top-0 z-40">
      {/* Brand & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          {/* Roku Channel Icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#662D91] to-[#a341e8] flex items-center justify-center shadow-md shadow-purple-950/80 group-hover:scale-105 transition-transform">
            <Tv className="w-5 h-5 text-white" />
          </div>
          
          <div className="text-left">
            <span className="font-bold text-sm tracking-tight text-white block leading-none">
              {channelTitle}
            </span>
            <span className="text-[10px] text-purple-400 font-mono">{config.appSubtitle}</span>
          </div>
        </button>

        {/* Scene Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 ml-4 pl-4 border-l border-purple-900/50 text-xs text-gray-400">
          <ChevronRight className="w-3.5 h-3.5 text-purple-500" />
          <span className="font-semibold text-purple-200">
            {currentScene === 'HOME' && 'Inicio'}
            {currentScene === 'PLAYER' && 'Player'}
            {currentScene === 'FEED_INSPECTOR' && 'Inspetor de Feed'}
          </span>
        </div>
      </div>

      {/* Right Controls & HUD */}
      <div className="flex items-center gap-3">
        {/* Layout Mode Switcher (Web/App View vs Roku TV Playlet Layout) */}
        {onToggleLayoutMode && (
          <button
            onClick={onToggleLayoutMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition border ${
              layoutMode === 'roku'
                ? 'bg-[#662D91] text-white border-purple-400 shadow-lg shadow-purple-900/60'
                : 'bg-[#1e172e] text-purple-200 border-purple-900/40 hover:bg-[#2e2345]'
            }`}
            title="Alternar entre layout Web e layout Roku TV"
          >
            <Tv className="w-3.5 h-3.5 text-purple-300" />
            <span>{layoutMode === 'roku' ? 'Layout Roku TV' : 'Layout Web'}</span>
          </button>
        )}

        {/* Direct Download button for physical Roku TV installation (DEV mode only) */}
        {import.meta.env.DEV && (
          <a
            href="/roku-channel.zip"
            download="roku-channel.zip"
            className="px-3 py-1.5 bg-[#1e172e] hover:bg-[#662D91] border border-purple-900/40 hover:border-purple-400 text-purple-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            title="Download roku-channel.zip for sideloading on Roku TV"
          >
            <Download className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden md:inline">Baixar ZIP Roku</span>
          </a>
        )}

        {/* Remote Control Button Toggle */}
        <button
          onClick={onToggleRemote}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition border ${
            isRemoteOpen
              ? 'bg-[#662D91] text-white border-purple-400 shadow-md shadow-purple-900/50'
              : 'bg-[#1e172e] text-purple-200 border-purple-900/40 hover:bg-[#2e2345]'
          }`}
          title="Toggle On-Screen Roku Remote"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span>Controle Remoto</span>
        </button>

        {/* Developer Logs / Inspector Button (Only active in Dev Mode) */}
        {config.devMode && (
          <button
            onClick={onToggleInspector}
            className="px-3 py-1.5 bg-[#1e172e] hover:bg-[#2e2345] border border-purple-900/40 text-gray-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            title="SceneGraph Logs & Feed Debugger (Dev Mode)"
          >
            <Code className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Inspetor</span>
          </button>
        )}

        {/* Status HUD (WiFi Connectivity + Clock) */}
        <div className="flex items-center gap-3 text-xs text-gray-300 ml-2 pl-3 border-l border-purple-900/50">
          <span title={isOnline ? "Network Status: Connected (Online)" : "Network Status: Disconnected (Offline)"}>
            {isOnline ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" />
            )}
          </span>
          <span className="font-mono text-xs font-bold text-gray-200">{time}</span>
        </div>
      </div>
    </header>
  );
};

