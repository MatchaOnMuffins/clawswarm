import { useEffect, useState } from 'react';
import { getAggregations, Aggregation, LevelStats } from '../api/client';
import AggregationTree from '../components/AggregationTree';

export default function Aggregations() {
  const [aggregationsByLevel, setAggregationsByLevel] = useState<
    Record<number, Aggregation[]>
  >({});
  const [levelStats, setLevelStats] = useState<LevelStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAggregations();
        setAggregationsByLevel(data.aggregationsByLevel);
        setLevelStats(data.levelStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
          </div>
          <span className="text-slate-500 text-sm tracking-wide">Loading aggregation hierarchy...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-6 border-rose-500/20 animate-slide-up">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-400">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h3 className="text-rose-300 font-semibold mb-1">Error Loading Aggregations</h3>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const levels = Object.keys(aggregationsByLevel)
    .map(Number)
    .sort((a, b) => b - a);
  const hasAggregations = levels.length > 0;
  const maxLevel = Math.max(...levels, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Aggregation Hierarchy</h1>
            <p className="text-sm text-slate-500">Multi-level solution synthesis</p>
          </div>
        </div>
      </div>

      {/* Level Stats Visualization */}
      <div className="glass rounded-2xl p-6 animate-slide-up delay-100" style={{ animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-2 mb-5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Level Distribution</span>
        </div>
        <AggregationTree levelStats={levelStats} />
      </div>

      {/* Level Tabs */}
      {hasAggregations && (
        <div className="flex gap-2 flex-wrap animate-slide-up delay-200" style={{ animationFillMode: 'forwards' }}>
          <button
            onClick={() => setSelectedLevel(null)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              selectedLevel === null
                ? 'bg-gradient-to-r from-violet-500/20 to-violet-500/5 text-violet-300 border border-violet-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-700/50 hover:text-slate-300'
            }`}
          >
            All Levels
          </button>
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                selectedLevel === level
                  ? level === maxLevel
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-300 border border-amber-500/30'
                    : 'bg-gradient-to-r from-violet-500/20 to-violet-500/5 text-violet-300 border border-violet-500/30'
                  : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-700/50 hover:text-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                level === maxLevel ? 'bg-amber-500' : 'bg-violet-500'
              }`} />
              Level {level}
              <span className="text-xs opacity-60">
                ({aggregationsByLevel[level]?.length || 0})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Aggregations List */}
      {!hasAggregations ? (
        <div className="glass rounded-2xl p-12 text-center animate-slide-up delay-200" style={{ animationFillMode: 'forwards' }}>
          <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-300 mb-2">No Aggregations Yet</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Aggregations are synthesized when sufficient L1 solutions have been collected
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(selectedLevel !== null ? [selectedLevel] : levels).map((level, levelIndex) => (
            <div key={level} className="space-y-3">
              {selectedLevel === null && (
                <div className="flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${levelIndex * 100 + 300}ms`, animationFillMode: 'forwards' }}>
                  <span className={`w-2 h-2 rounded-full ${level === maxLevel ? 'bg-amber-500' : 'bg-violet-500'}`} />
                  <h3 className={`text-lg font-semibold ${level === maxLevel ? 'text-amber-300' : 'text-white'}`}>
                    Level {level}
                  </h3>
                  {level === maxLevel && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Highest
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {aggregationsByLevel[level]?.length || 0} aggregation{(aggregationsByLevel[level]?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {aggregationsByLevel[level]?.map((agg, index) => (
                <AggregationCard
                  key={agg.id}
                  aggregation={agg}
                  isExpanded={expandedId === agg.id}
                  onToggle={() => setExpandedId(expandedId === agg.id ? null : agg.id)}
                  isHighestLevel={level === maxLevel}
                  delay={(levelIndex * 100) + (index * 50) + 350}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AggregationCard({
  aggregation,
  isExpanded,
  onToggle,
  isHighestLevel,
  delay,
}: {
  aggregation: Aggregation;
  isExpanded: boolean;
  onToggle: () => void;
  isHighestLevel: boolean;
  delay: number;
}) {
  const borderColor = aggregation.isFinal
    ? 'border-emerald-500/30 hover:border-emerald-500/50'
    : isHighestLevel
    ? 'border-amber-500/20 hover:border-amber-500/40'
    : 'border-white/5 hover:border-violet-500/30';

  return (
    <div
      className={`glass rounded-xl overflow-hidden transition-all duration-300 border animate-slide-up opacity-0 ${borderColor}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <button
        onClick={onToggle}
        className="w-full p-5 text-left transition-all duration-200 hover:bg-white/[0.02] group"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {/* Agent avatar */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isHighestLevel
                  ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30'
                  : 'bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30'
              }`}>
                <span className="text-xs font-bold text-white">
                  {aggregation.agent.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="font-semibold text-white truncate">
                {aggregation.agent.name}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                isHighestLevel
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
              }`}>
                L{aggregation.level}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                {aggregation.parentCount} sources
              </span>
              {aggregation.isFinal && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 uppercase tracking-wider">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Final
                </span>
              )}
            </div>

            {aggregation.answer && (
              <div className="mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider mr-2">Answer:</span>
                <span className={isHighestLevel ? 'text-amber-300' : 'text-violet-300'}>{aggregation.answer}</span>
                {aggregation.confidence !== null && (
                  <span className="ml-3 text-slate-500">
                    <span className="text-xs uppercase tracking-wider mr-1">Confidence:</span>
                    <span className={`font-mono font-medium ${
                      aggregation.confidence > 0.8 ? 'text-emerald-400' :
                      aggregation.confidence > 0.5 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {(aggregation.confidence * 100).toFixed(0)}%
                    </span>
                  </span>
                )}
              </div>
            )}

            <p className="text-xs text-slate-500 flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {new Date(aggregation.createdAt).toLocaleString()}
            </p>
          </div>

          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
            isExpanded
              ? isHighestLevel ? 'bg-amber-500/20 rotate-180' : 'bg-violet-500/20 rotate-180'
              : 'bg-slate-800/50 group-hover:bg-slate-700/50'
          }`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={
              isExpanded
                ? isHighestLevel ? 'text-amber-400' : 'text-violet-400'
                : 'text-slate-400'
            }>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
        <div className="border-t border-white/5 p-5 bg-[#050a0e]/50">
          <span className="text-xs text-slate-500 uppercase tracking-wider mb-3 block">Aggregated Analysis</span>
          <pre className="mono whitespace-pre-wrap text-sm text-slate-300 max-h-80 overflow-y-auto leading-relaxed">
            {aggregation.content}
          </pre>
        </div>
      </div>
    </div>
  );
}
