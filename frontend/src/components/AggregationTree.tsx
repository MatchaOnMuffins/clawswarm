import { LevelStats } from '../api/client';

interface Props {
  levelStats: LevelStats[];
}

export default function AggregationTree({ levelStats }: Props) {
  if (levelStats.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
        <p className="text-slate-500 text-sm">No aggregation data yet</p>
      </div>
    );
  }

  const sortedStats = [...levelStats].sort((a, b) => a.level - b.level);
  const maxLevel = Math.max(...sortedStats.map((s) => s.level));
  const totalSolutions = sortedStats.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-8">
      {/* Neural Funnel Visualization */}
      <div className="relative py-6">
        {/* Connection lines background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-px h-full neural-line opacity-30" />
        </div>

        <div className="flex flex-col items-center gap-1 relative">
          {sortedStats.map((stat, index) => {
            const isFirst = stat.level === 1;
            const isLast = stat.level === maxLevel;
            const widthPercent = isFirst ? 100 : Math.max(30, 100 - (stat.level - 1) * 20);
            const nodeCount = Math.min(stat.count, 12);

            return (
              <div key={stat.level} className="w-full flex flex-col items-center">
                {/* Level container */}
                <div
                  className="relative group transition-all duration-500"
                  style={{ width: `${widthPercent}%`, minWidth: '200px' }}
                >
                  {/* Glow effect on hover */}
                  <div className={`absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl ${
                    isFirst ? 'bg-cyan-500/20' :
                    isLast ? 'bg-amber-500/20' :
                    'bg-violet-500/20'
                  }`} />

                  {/* Main level bar */}
                  <div className={`relative rounded-xl p-4 border transition-all duration-300 ${
                    isFirst
                      ? 'bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-cyan-500/10 border-cyan-500/20 group-hover:border-cyan-500/40'
                      : isLast
                      ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40'
                      : 'bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-violet-500/10 border-violet-500/20 group-hover:border-violet-500/40'
                  }`}>
                    <div className="flex items-center justify-between">
                      {/* Level indicator */}
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                          isFirst ? 'bg-cyan-500/20 text-cyan-400' :
                          isLast ? 'bg-amber-500/20 text-amber-400' :
                          'bg-violet-500/20 text-violet-400'
                        }`}>
                          L{stat.level}
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${
                            isFirst ? 'text-cyan-300' :
                            isLast ? 'text-amber-300' :
                            'text-violet-300'
                          }`}>
                            {isFirst ? 'Raw Solutions' : isLast ? 'Final Synthesis' : `Aggregation L${stat.level}`}
                          </div>
                          <div className="text-xs text-slate-500">
                            {((stat.count / totalSolutions) * 100).toFixed(0)}% of total
                          </div>
                        </div>
                      </div>

                      {/* Node visualization */}
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {Array.from({ length: nodeCount }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full border-2 border-[#0a1219] ${
                                isFirst ? 'bg-cyan-500' :
                                isLast ? 'bg-amber-500' :
                                'bg-violet-500'
                              }`}
                              style={{
                                opacity: 0.4 + (0.6 * (i + 1) / nodeCount),
                                transform: `scale(${0.8 + (0.2 * (i + 1) / nodeCount)})`,
                              }}
                            />
                          ))}
                          {stat.count > 12 && (
                            <div className="w-6 h-3 rounded-full bg-slate-700 flex items-center justify-center ml-1">
                              <span className="text-[8px] text-slate-400">+{stat.count - 12}</span>
                            </div>
                          )}
                        </div>
                        <span className={`text-2xl font-bold tabular-nums ${
                          isFirst ? 'text-cyan-400' :
                          isLast ? 'text-amber-400' :
                          'text-violet-400'
                        }`}>
                          {stat.count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connector to next level */}
                {index < sortedStats.length - 1 && (
                  <div className="flex flex-col items-center py-2">
                    <div className={`w-px h-6 ${
                      isFirst ? 'bg-gradient-to-b from-cyan-500/50 to-violet-500/50' :
                      sortedStats[index + 1]?.level === maxLevel
                        ? 'bg-gradient-to-b from-violet-500/50 to-amber-500/50'
                        : 'bg-violet-500/30'
                    }`} />
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`-mt-1 ${
                        isFirst ? 'text-violet-500' :
                        sortedStats[index + 1]?.level === maxLevel ? 'text-amber-500' :
                        'text-violet-500'
                      }`}
                    >
                      <path
                        d="M12 5v14M5 12l7 7 7-7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-3 gap-3">
        {sortedStats.map((stat) => {
          const isFirst = stat.level === 1;
          const isLast = stat.level === maxLevel;

          return (
            <div
              key={stat.level}
              className={`relative overflow-hidden rounded-xl p-4 border transition-all duration-300 group cursor-default ${
                isFirst
                  ? 'bg-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/40'
                  : isLast
                  ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
                  : 'bg-violet-500/5 border-violet-500/20 hover:border-violet-500/40'
              }`}
            >
              {/* Subtle glow on hover */}
              <div className={`absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                isFirst ? 'bg-gradient-to-br from-cyan-500/10 to-transparent' :
                isLast ? 'bg-gradient-to-br from-amber-500/10 to-transparent' :
                'bg-gradient-to-br from-violet-500/10 to-transparent'
              }`} />

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${
                    isFirst ? 'bg-cyan-500' :
                    isLast ? 'bg-amber-500' :
                    'bg-violet-500'
                  }`} />
                  <span className="text-xs text-slate-500 uppercase tracking-wider">
                    Level {stat.level}
                  </span>
                </div>
                <div className={`text-2xl font-bold ${
                  isFirst ? 'text-cyan-400' :
                  isLast ? 'text-amber-400' :
                  'text-violet-400'
                }`}>
                  {stat.count}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {isFirst ? 'Raw solutions' : isLast ? 'Top synthesis' : 'Aggregations'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500" />
          <span className="text-xs text-slate-500">L1 Raw</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-violet-500" />
          <span className="text-xs text-slate-500">L2+ Aggregated</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-xs text-slate-500">Top Level</span>
        </div>
      </div>
    </div>
  );
}
