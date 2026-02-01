import { useEffect, useState } from 'react';
import {
  getCurrentProblem,
  getAggregations,
  getFinalAggregation,
  Problem,
  ProblemStats,
  LevelStats,
  Solution,
} from '../api/client';

export default function Dashboard() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [stats, setStats] = useState<ProblemStats | null>(null);
  const [levelStats, setLevelStats] = useState<LevelStats[]>([]);
  const [finalSolution, setFinalSolution] = useState<Solution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [problemData, aggData, finalData] = await Promise.all([
          getCurrentProblem(),
          getAggregations(),
          getFinalAggregation(),
        ]);

        setProblem(problemData.problem);
        setStats(problemData.stats);
        setLevelStats(aggData.levelStats);
        setFinalSolution(finalData.final || finalData.highestLevel || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
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
            <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-r-violet-500/50 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
          </div>
          <span className="text-slate-500 text-sm tracking-wide">Connecting to neural mesh...</span>
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
            <h3 className="text-rose-300 font-semibold mb-1">Connection Error</h3>
            <p className="text-slate-400 text-sm">{error}</p>
            <p className="text-slate-500 text-xs mt-2">
              Ensure the backend is running on port 3001
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="glass rounded-2xl p-8 text-center animate-slide-up">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-200 mb-2">No Active Problem</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Create a new problem using <code className="mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded">POST /api/v1/problems</code> to begin
        </p>
      </div>
    );
  }

  const phaseConfig = {
    collecting: { color: 'emerald', label: 'Collecting', icon: '◉' },
    aggregating: { color: 'amber', label: 'Aggregating', icon: '◈' },
    final: { color: 'cyan', label: 'Complete', icon: '◆' },
  };

  const phase = phaseConfig[problem.phase as keyof typeof phaseConfig] || phaseConfig.collecting;

  return (
    <div className="space-y-8">
      {/* Problem Card */}
      <div className="glass rounded-2xl overflow-hidden animate-slide-up">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider flex items-center gap-2
                  ${phase.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : ''}
                  ${phase.color === 'amber' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : ''}
                  ${phase.color === 'cyan' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : ''}
                `}>
                  <span className="animate-pulse">{phase.icon}</span>
                  {phase.label}
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{problem.title}</h1>
            </div>
          </div>
        </div>
        <div className="p-6 bg-[#050a0e]/50">
          <pre className="mono whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
            {problem.statement}
          </pre>
        </div>
        {problem.hints.length > 0 && (
          <div className="px-6 py-4 border-t border-white/5 bg-violet-500/5">
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Hints</span>
            </div>
            <ul className="space-y-2">
              {problem.hints.map((hint, i) => (
                <li key={i} className="text-slate-400 text-sm pl-4 border-l-2 border-violet-500/30">
                  {hint}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="L1 Solutions"
          value={stats?.l1Solutions || 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
          }
          color="cyan"
          delay={0}
        />
        <StatCard
          label="Aggregations"
          value={stats?.totalAggregations || 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          }
          color="violet"
          delay={100}
        />
        <StatCard
          label="Active Agents"
          value={stats?.participatingAgents || 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          color="emerald"
          delay={200}
        />
        <StatCard
          label="Highest Level"
          value={stats?.highestLevel || 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          }
          color="amber"
          delay={300}
        />
      </div>

      {/* Level Progress */}
      <div className="glass rounded-2xl p-6 animate-slide-up opacity-0 delay-200" style={{ animationFillMode: 'forwards' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </span>
            Aggregation Progress
          </h2>
          {levelStats.length > 0 && (
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              {levelStats.length} levels active
            </span>
          )}
        </div>
        {levelStats.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">Waiting for solutions...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {levelStats
              .sort((a, b) => a.level - b.level)
              .map((stat, index) => {
                const maxCount = Math.max(...levelStats.map(s => s.count));
                const percentage = (stat.count / maxCount) * 100;
                const isHighest = stat.level === Math.max(...levelStats.map(s => s.level));

                return (
                  <div key={stat.level} className="group" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex items-center gap-4">
                      <div className={`w-20 flex items-center gap-2 ${isHighest ? 'text-amber-400' : 'text-slate-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${
                          stat.level === 1 ? 'bg-cyan-500' :
                          isHighest ? 'bg-amber-500' : 'bg-violet-500'
                        }`} />
                        <span className="text-sm font-medium">
                          L{stat.level}
                        </span>
                      </div>
                      <div className="flex-1 h-3 bg-slate-800/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${
                            stat.level === 1 ? 'bg-gradient-to-r from-cyan-600 to-cyan-400' :
                            isHighest ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                            'bg-gradient-to-r from-violet-600 to-violet-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        >
                          <div className="absolute inset-0 shimmer" />
                        </div>
                      </div>
                      <span className={`w-12 text-right text-sm font-mono ${isHighest ? 'text-amber-300' : 'text-slate-300'}`}>
                        {stat.count}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Final/Current Best Answer */}
      {finalSolution && (
        <div className="glass rounded-2xl overflow-hidden animate-slide-up opacity-0 delay-300" style={{ animationFillMode: 'forwards' }}>
          <div className="p-6 border-b border-white/5 bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  finalSolution.isFinal
                    ? 'bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 glow-emerald'
                    : 'bg-gradient-to-br from-cyan-500/20 to-cyan-500/5'
                }`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={finalSolution.isFinal ? 'text-emerald-400' : 'text-cyan-400'}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                {finalSolution.isFinal ? 'Final Answer' : 'Current Best Answer'}
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-400 border border-slate-700/50">
                Level {finalSolution.level}
              </span>
            </div>
          </div>

          {finalSolution.answer && (
            <div className="p-6 border-b border-white/5">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Answer</span>
                  <p className="text-lg text-white font-medium leading-relaxed">{finalSolution.answer}</p>
                </div>
                {finalSolution.confidence !== null && (
                  <div className="text-right">
                    <span className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Confidence</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-800/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                          style={{ width: `${finalSolution.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold text-emerald-400">
                        {(finalSolution.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-6 bg-[#050a0e]/50">
            <span className="text-xs text-slate-500 uppercase tracking-wider mb-3 block">Full Response</span>
            <pre className="mono whitespace-pre-wrap text-sm text-slate-300 max-h-96 overflow-y-auto leading-relaxed">
              {finalSolution.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  delay,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'cyan' | 'violet' | 'emerald' | 'amber';
  delay: number;
}) {
  const colors = {
    cyan: {
      bg: 'from-cyan-500/20 to-cyan-500/5',
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      text: 'text-cyan-400',
      glow: 'group-hover:shadow-cyan-500/20',
    },
    violet: {
      bg: 'from-violet-500/20 to-violet-500/5',
      border: 'border-violet-500/20 hover:border-violet-500/40',
      text: 'text-violet-400',
      glow: 'group-hover:shadow-violet-500/20',
    },
    emerald: {
      bg: 'from-emerald-500/20 to-emerald-500/5',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      text: 'text-emerald-400',
      glow: 'group-hover:shadow-emerald-500/20',
    },
    amber: {
      bg: 'from-amber-500/20 to-amber-500/5',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      text: 'text-amber-400',
      glow: 'group-hover:shadow-amber-500/20',
    },
  };

  const c = colors[color];

  return (
    <div
      className={`group stat-card glass rounded-xl p-5 border ${c.border} transition-all duration-300 hover:shadow-lg ${c.glow} animate-slide-up opacity-0`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-4xl font-bold text-white tracking-tight mb-1">{value}</div>
          <div className="text-sm text-slate-400">{label}</div>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center ${c.text}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
