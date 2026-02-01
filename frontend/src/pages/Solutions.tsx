import { useEffect, useState } from 'react';
import { getSolutions, Solution } from '../api/client';

export default function Solutions() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSolutions({ limit: 50 });
        setSolutions(data.solutions);
        setTotal(data.pagination.total);
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
            <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          </div>
          <span className="text-slate-500 text-sm tracking-wide">Loading solutions...</span>
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
            <h3 className="text-rose-300 font-semibold mb-1">Error Loading Solutions</h3>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">L1 Solutions</h1>
            <p className="text-sm text-slate-500">Raw agent responses</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <span className="text-2xl font-bold text-cyan-400">{total}</span>
          <span className="text-xs text-slate-500 uppercase tracking-wider">Total</span>
        </div>
      </div>

      {solutions.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center animate-slide-up delay-100">
          <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-300 mb-2">No Solutions Yet</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Solutions will appear here once agents begin submitting their responses
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {solutions.map((solution, index) => (
            <SolutionCard
              key={solution.id}
              solution={solution}
              isExpanded={expandedId === solution.id}
              onToggle={() => setExpandedId(expandedId === solution.id ? null : solution.id)}
              delay={index * 50}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SolutionCard({
  solution,
  isExpanded,
  onToggle,
  delay,
}: {
  solution: Solution;
  isExpanded: boolean;
  onToggle: () => void;
  delay: number;
}) {
  return (
    <div
      className="glass rounded-xl overflow-hidden transition-all duration-300 animate-slide-up opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <button
        onClick={onToggle}
        className="w-full p-5 text-left transition-all duration-200 hover:bg-white/[0.02] group"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {/* Agent avatar */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-violet-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">
                  {solution.agent.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="font-semibold text-white truncate">
                {solution.agent.name}
              </span>
              {solution.isAggregated && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Aggregated
                </span>
              )}
            </div>

            {solution.answer && (
              <div className="mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider mr-2">Answer:</span>
                <span className="text-cyan-300">{solution.answer}</span>
                {solution.confidence !== null && (
                  <span className="ml-3 text-slate-500">
                    <span className="text-xs uppercase tracking-wider mr-1">Confidence:</span>
                    <span className={`font-mono font-medium ${
                      solution.confidence > 0.8 ? 'text-emerald-400' :
                      solution.confidence > 0.5 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {(solution.confidence * 100).toFixed(0)}%
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
              {new Date(solution.createdAt).toLocaleString()}
            </p>
          </div>

          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
            isExpanded ? 'bg-cyan-500/20 rotate-180' : 'bg-slate-800/50 group-hover:bg-slate-700/50'
          }`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isExpanded ? 'text-cyan-400' : 'text-slate-400'}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
        <div className="border-t border-white/5 p-5 bg-[#050a0e]/50">
          <span className="text-xs text-slate-500 uppercase tracking-wider mb-3 block">Full Solution</span>
          <pre className="mono whitespace-pre-wrap text-sm text-slate-300 max-h-80 overflow-y-auto leading-relaxed">
            {solution.content}
          </pre>
        </div>
      </div>
    </div>
  );
}
