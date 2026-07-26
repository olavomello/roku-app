import React from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Home, 
  Asterisk, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Tv, 
  X,
  Code
} from 'lucide-react';

interface RokuRemoteProps {
  onDirection: (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => void;
  onSelect: () => void;
  onBack: () => void;
  onHome: () => void;
  onPlayPause: () => void;
  onStar: () => void;
  onToggleInspector: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const RokuRemote: React.FC<RokuRemoteProps> = ({
  onDirection,
  onSelect,
  onBack,
  onHome,
  onPlayPause,
  onStar,
  onToggleInspector,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="w-64 bg-[#1a1426] border-2 border-[#662D91] rounded-3xl p-5 shadow-2xl text-white relative flex flex-col items-center">
        {/* Remote Header */}
        <div className="w-full flex items-center justify-between border-b border-[#2d2442] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-[#9e46ea]" />
            <span className="font-bold text-xs uppercase tracking-wider text-purple-300">Roku Remote</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-[#2d2442] rounded-full transition"
            title="Minimize Remote"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Control Row */}
        <div className="flex items-center justify-between w-full px-2 mb-4">
          <button
            onClick={onHome}
            className="w-10 h-10 bg-[#2d2442] hover:bg-[#662D91] text-purple-200 rounded-full flex items-center justify-center transition active:scale-95 shadow-md"
            title="Home (H)"
          >
            <Home className="w-5 h-5" />
          </button>
          
          <button
            onClick={onBack}
            className="w-10 h-10 bg-[#2d2442] hover:bg-[#662D91] text-purple-200 rounded-full flex items-center justify-center transition active:scale-95 shadow-md font-bold text-xs"
            title="Back (Esc / Backspace)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onStar}
            className="w-10 h-10 bg-[#2d2442] hover:bg-[#662D91] text-purple-200 rounded-full flex items-center justify-center transition active:scale-95 shadow-md"
            title="Options (*)"
          >
            <Asterisk className="w-5 h-5" />
          </button>
        </div>

        {/* D-PAD / Purple Ring Navigation */}
        <div className="relative w-40 h-40 rounded-full bg-[#120d1c] border-2 border-[#3d2a54] flex items-center justify-center my-2 shadow-inner">
          {/* UP */}
          <button
            onClick={() => onDirection('UP')}
            className="absolute top-1 w-12 h-10 hover:bg-[#662D91]/40 rounded-t-full flex items-center justify-center text-purple-300 active:scale-90 transition"
            title="Up Arrow"
          >
            <ChevronUp className="w-6 h-6" />
          </button>

          {/* DOWN */}
          <button
            onClick={() => onDirection('DOWN')}
            className="absolute bottom-1 w-12 h-10 hover:bg-[#662D91]/40 rounded-b-full flex items-center justify-center text-purple-300 active:scale-90 transition"
            title="Down Arrow"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          {/* LEFT */}
          <button
            onClick={() => onDirection('LEFT')}
            className="absolute left-1 h-12 w-10 hover:bg-[#662D91]/40 rounded-l-full flex items-center justify-center text-purple-300 active:scale-90 transition"
            title="Left Arrow"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* RIGHT */}
          <button
            onClick={() => onDirection('RIGHT')}
            className="absolute right-1 h-12 w-10 hover:bg-[#662D91]/40 rounded-r-full flex items-center justify-center text-purple-300 active:scale-90 transition"
            title="Right Arrow"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* CENTER OK BUTTON */}
          <button
            onClick={onSelect}
            className="w-16 h-16 bg-[#662D91] hover:bg-[#8034be] rounded-full flex items-center justify-center font-bold text-sm tracking-wide text-white shadow-lg active:scale-95 transition border border-purple-400/30"
            title="OK / Select (Enter)"
          >
            OK
          </button>
        </div>

        {/* Playback Controls Row */}
        <div className="flex items-center justify-around w-full mt-4 pt-3 border-t border-[#2d2442]">
          <button
            onClick={onPlayPause}
            className="w-12 h-10 bg-[#2d2442] hover:bg-[#662D91] rounded-lg flex items-center justify-center text-white transition active:scale-95 shadow"
            title="Play / Pause (Space)"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={onToggleInspector}
            className="px-3 h-10 bg-[#2d2442] hover:bg-[#662D91] text-purple-200 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition active:scale-95 shadow"
            title="Dev Feed Inspector"
          >
            <Code className="w-4 h-4 text-purple-400" />
            <span>Feed Logs</span>
          </button>
        </div>

        {/* Keyboard Tips */}
        <div className="mt-3 text-[10px] text-gray-400 text-center leading-tight">
          Use Arrow Keys, Enter, Esc, Spacebar on your keyboard or tap buttons above.
        </div>
      </div>
    </div>
  );
};
