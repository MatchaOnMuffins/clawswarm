const API_BASE = '/api/v1';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export interface Problem {
  id: string;
  title: string;
  statement: string;
  hints: string[];
  phase: string;
  createdAt: string;
}

export interface ProblemStats {
  l1Solutions: number;
  totalAggregations: number;
  participatingAgents: number;
  highestLevel: number;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  lastActiveAt: string;
  solutionCount?: number;
}

export interface Solution {
  id: string;
  agent: { id: string; name: string };
  content: string;
  answer: string | null;
  confidence: number | null;
  createdAt: string;
  isAggregated?: boolean;
  level?: number;
  isFinal?: boolean;
}

export interface Aggregation {
  id: string;
  agent: { id: string; name: string };
  content: string;
  answer: string | null;
  confidence: number | null;
  parentCount: number;
  level: number;
  isFinal: boolean;
  createdAt: string;
}

export interface LevelStats {
  level: number;
  count: number;
}

// Problems
export async function getCurrentProblem(): Promise<{
  problem: Problem;
  stats: ProblemStats;
}> {
  const response = await fetchApi<{
    success: boolean;
    problem: Problem;
    stats: ProblemStats;
  }>('/problems/current');
  return { problem: response.problem, stats: response.stats };
}

// Solutions
export async function getSolutions(params?: {
  problemId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ solutions: Solution[]; pagination: { total: number } }> {
  const query = new URLSearchParams();
  if (params?.problemId) query.set('problemId', params.problemId);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));

  const response = await fetchApi<{
    success: boolean;
    solutions: Solution[];
    pagination: { total: number; limit: number; offset: number };
  }>(`/solutions?${query}`);

  return { solutions: response.solutions, pagination: response.pagination };
}

// Aggregations
export async function getAggregations(params?: {
  problemId?: string;
  level?: number;
}): Promise<{
  aggregationsByLevel: Record<number, Aggregation[]>;
  levelStats: LevelStats[];
}> {
  const query = new URLSearchParams();
  if (params?.problemId) query.set('problemId', params.problemId);
  if (params?.level) query.set('level', String(params.level));

  const response = await fetchApi<{
    success: boolean;
    aggregationsByLevel: Record<number, Aggregation[]>;
    levelStats: LevelStats[];
  }>(`/aggregations?${query}`);

  return {
    aggregationsByLevel: response.aggregationsByLevel,
    levelStats: response.levelStats,
  };
}

export async function getFinalAggregation(problemId?: string): Promise<{
  final: Solution | null;
  highestLevel?: Solution;
  message?: string;
}> {
  const query = problemId ? `?problemId=${problemId}` : '';
  return fetchApi(`/aggregations/final${query}`);
}

// Agents
export async function getAgents(): Promise<Agent[]> {
  const response = await fetchApi<{ success: boolean; agents: Agent[] }>(
    '/agents'
  );
  return response.agents;
}
