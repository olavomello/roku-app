import React, { useState, useEffect } from 'react';
import { LogEntry, FeedData } from '../types';
import { logger } from '../utils/logger';
import { Code, Terminal, RefreshCw, AlertTriangle, CheckCircle, Trash2, Globe, FileJson, X } from 'lucide-react';

interface FeedInspectorProps {
  currentFeedUrl: string;
  onLoadFeedUrl: (url: string) => void;
  feedData: FeedData | null;
  onClose: () => void;
}

export const FeedInspector: React.FC<FeedInspectorProps> = ({
  currentFeedUrl,
  onLoadFeedUrl,
  feedData,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'LOGS' | 'URL' | 'JSON'>('LOGS');
  const [customUrl, setCustomUrl] = useState<string>(currentFeedUrl);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  useEffect(() => {
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return () => unsubscribe();
  }, []);

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onLoadFeedUrl(customUrl);
  };

  const filteredLogs = logs.filter((l) => {
    if (filterLevel === 'ALL') return true;
    return l.level === filterLevel;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#140e21] border-2 border-[#662D91] rounded-2xl shadow-2xl flex flex-col h-[85vh] text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a1e42] bg-[#1a132b]">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-purple-400" />
            <h2 className="font-bold text-base tracking-wide text-white">Roku SceneGraph Feed & Task Inspector</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#271d3d] p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('LOGS')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === 'LOGS' ? 'bg-[#662D91] text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>SceneGraph Logs ({logs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('URL')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === 'URL' ? 'bg-[#662D91] text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Feed Source</span>
              </button>

              <button
                onClick={() => setActiveTab('JSON')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === 'JSON' ? 'bg-[#662D91] text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Raw Feed Data</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2a1e42] rounded-full transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0 bg-[#100b1a]">
          {/* TAB 1: LOGS */}
          {activeTab === 'LOGS' && (
            <div className="flex flex-col h-full space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#231738]">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400">Filter Level:</span>
                  {['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setFilterLevel(lvl)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition ${
                        filterLevel === lvl
                          ? 'bg-[#662D91] text-white'
                          : 'bg-[#1c142c] text-gray-400 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => logger.clear()}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition px-2 py-1 bg-red-950/30 rounded border border-red-900/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Logs</span>
                </button>
              </div>

              <div className="flex-1 bg-[#0a0711] rounded-xl border border-[#231738] p-4 font-mono text-xs overflow-y-auto space-y-1.5">
                {filteredLogs.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No log entries matching filter.</div>
                ) : (
                  filteredLogs.map((log) => {
                    let levelColor = 'text-blue-400';
                    if (log.level === 'WARN') levelColor = 'text-amber-400';
                    if (log.level === 'ERROR') levelColor = 'text-red-400';
                    if (log.level === 'DEBUG') levelColor = 'text-gray-400';

                    return (
                      <div key={log.id} className="flex items-start gap-2 hover:bg-[#150f24] p-1 rounded">
                        <span className="text-gray-500 text-[10px] shrink-0">{log.timestamp}</span>
                        <span className={`font-bold shrink-0 text-[10px] uppercase w-12 ${levelColor}`}>
                          [{log.level}]
                        </span>
                        <span className="text-purple-300 font-semibold shrink-0 text-[11px]">
                          [{log.module}]:
                        </span>
                        <span className="text-gray-200 break-all">{log.message}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FEED SOURCE URL */}
          {activeTab === 'URL' && (
            <div className="space-y-6 max-w-xl mx-auto py-4">
              <div className="bg-[#1a132b] border border-purple-900/40 p-4 rounded-xl space-y-2">
                <h3 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>Feed Endpoint Configuration</span>
                </h3>
                <p className="text-xs text-gray-300">
                  Load a local sample feed or test a custom remote HTTP/HTTPS JSON feed endpoint (e.g. Roku Content Feed spec).
                </p>
              </div>

              <form onSubmit={handleApplyUrl} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Feed URL or Preset
                  </label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://api.example.com/feed.json or /feeds/sample-feed.json"
                    className="w-full px-4 py-2.5 bg-[#0a0711] border border-purple-800/50 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#662D91] hover:bg-[#8034be] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Fetch & Parse Feed</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCustomUrl('/feeds/sample-feed.json');
                      onLoadFeedUrl('/feeds/sample-feed.json');
                    }}
                    className="px-4 py-2.5 bg-[#271d3d] hover:bg-[#3d2e5c] text-purple-200 font-semibold text-xs rounded-xl transition"
                  >
                    Reset to Local Sample
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: RAW JSON DATA */}
          {activeTab === 'JSON' && (
            <div className="flex flex-col h-full space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400 pb-2">
                <span>Loaded Video Count: {feedData?.videos.length || 0}</span>
                <span className="text-purple-300">Provider: {feedData?.providerName || 'Local'}</span>
              </div>
              <pre className="flex-1 bg-[#0a0711] border border-purple-900/40 p-4 rounded-xl text-xs font-mono text-purple-200 overflow-auto">
                {JSON.stringify(feedData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
