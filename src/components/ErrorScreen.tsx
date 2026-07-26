import React from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

interface ErrorScreenProps {
  title?: string;
  message: string;
  onRetry: () => void;
  onResetFeed?: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  title = 'Feed Error',
  message,
  onRetry,
  onResetFeed
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center text-white">
      <div className="w-20 h-20 rounded-full bg-red-950/80 border-2 border-red-500 text-red-400 flex items-center justify-center mb-6 shadow-2xl animate-bounce">
        <AlertOctagon className="w-10 h-10" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">{title}</h1>
      <p className="text-sm text-gray-300 max-w-md mb-8 leading-relaxed">
        {message}
      </p>

      <div className="flex items-center gap-4">
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-[#662D91] hover:bg-[#8034be] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Tentar novamente (Try Again)</span>
        </button>

        {onResetFeed && (
          <button
            onClick={onResetFeed}
            className="px-6 py-3 bg-[#271d3d] hover:bg-[#3d2e5c] text-purple-200 font-bold text-xs rounded-xl flex items-center gap-2 transition active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Load Sample Feed</span>
          </button>
        )}
      </div>
    </div>
  );
};
