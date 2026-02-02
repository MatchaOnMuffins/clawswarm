import { prisma } from "../index";
import { config } from "../config";
import {
  getSolveInstructions,
  getAggregationInstructions,
  AggregationSource,
} from "./AggregationInstructions";

export interface TaskAssignment {
  taskId: string;
  type: "solve" | "aggregate";
  problem: {
    id: string;
    title: string;
    statement: string;
    hints: string[];
  };
  level?: number;
  sources?: AggregationSource[];
  instruction: string;
  freshContextRequired: boolean;
}

export async function getNextTask(
  agentId: string,
): Promise<TaskAssignment | null> {
  // Get current active problem (only one problem can be active at a time)
  const problem = await prisma.problem.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!problem) {
    return null;
  }

  // Check if agent has an in-progress task for the CURRENT active problem
  const existingTask = await prisma.task.findFirst({
    where: {
      agentId,
      problemId: problem.id,
      status: "in_progress",
    },
  });

  if (existingTask) {
    // Return the existing task (it's guaranteed to be for the active problem)
    return await buildTaskResponse(existingTask.id);
  }

  // Always check for aggregation opportunities first
  const aggregationTask = await findAggregationOpportunity(agentId, problem.id);

  if (aggregationTask) {
    return aggregationTask;
  }

  // If no aggregation available, assign a new solve task (L1 attempt)
  // This allows agents to generate multiple attempts at the same problem
  return await assignSolveTask(agentId, problem);
}

async function assignSolveTask(
  agentId: string,
  problem: { id: string; title: string; statement: string; hints: string[] },
): Promise<TaskAssignment> {
  // Create task record
  const task = await prisma.task.create({
    data: {
      agentId,
      problemId: problem.id,
      type: "solve",
      status: "in_progress",
      payload: {},
    },
  });

  return {
    taskId: task.id,
    type: "solve",
    problem: {
      id: problem.id,
      title: problem.title,
      statement: problem.statement,
      hints: problem.hints,
    },
    instruction: getSolveInstructions(problem.title),
    freshContextRequired: false,
  };
}

async function findAggregationOpportunity(
  agentId: string,
  problemId: string,
): Promise<TaskAssignment | null> {
  const { minItemsToAggregate, targetItemsToAggregate, maxItemsToAggregate } =
    config.aggregation;

  // Get the problem
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
  });

  if (!problem) return null;

  // Find highest level with unaggregated solutions
  const levelStats = await prisma.solution.groupBy({
    by: ["level"],
    where: {
      problemId,
      aggregatedIntoId: null,
    },
    _count: { id: true },
    orderBy: { level: "asc" },
  });

  for (const stat of levelStats) {
    const level = stat.level;
    const count = stat._count.id;

    // Check if we have enough to aggregate
    if (count >= minItemsToAggregate) {
      // Try to claim solutions for aggregation
      const batchSize = Math.min(count, targetItemsToAggregate);

      // Get solutions that:
      // 1. Are at this level
      // 2. Haven't been aggregated yet
      // 3. Weren't created by this agent (can't aggregate own work)
      const availableSolutions = await prisma.solution.findMany({
        where: {
          problemId,
          level,
          aggregatedIntoId: null,
          agentId: { not: agentId },
        },
        include: {
          agent: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
        take: batchSize,
      });

      if (availableSolutions.length >= minItemsToAggregate) {
        // Check if this will be the final aggregation
        const totalUnaggregated = await prisma.solution.count({
          where: {
            problemId,
            aggregatedIntoId: null,
          },
        });

        const willBeFinal =
          totalUnaggregated <= maxItemsToAggregate && level > 1;

        // Create aggregation task
        const newLevel = level + 1;
        const sources: AggregationSource[] = availableSolutions.map((s) => ({
          id: s.id,
          content: s.content,
          answer: s.answer,
          confidence: s.confidence,
          agentName: s.agent.name,
          level: s.level,
        }));

        const task = await prisma.task.create({
          data: {
            agentId,
            problemId,
            type: "aggregate",
            level: newLevel,
            status: "in_progress",
            payload: {
              sourceIds: availableSolutions.map((s) => s.id),
              isFinal: willBeFinal,
            },
          },
        });

        // Mark solutions as being aggregated (claim them)
        await prisma.solution.updateMany({
          where: {
            id: { in: availableSolutions.map((s) => s.id) },
          },
          data: {
            aggregatedIntoId: task.id, // Use task ID as placeholder
          },
        });

        return {
          taskId: task.id,
          type: "aggregate",
          problem: {
            id: problem.id,
            title: problem.title,
            statement: problem.statement,
            hints: problem.hints,
          },
          level: newLevel,
          sources,
          instruction: getAggregationInstructions(
            newLevel,
            sources.length,
            willBeFinal,
          ),
          freshContextRequired: true,
        };
      }
    }
  }

  return null;
}

async function buildTaskResponse(
  taskId: string,
): Promise<TaskAssignment | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      problem: true,
    },
  });

  if (!task) return null;

  if (task.type === "solve") {
    return {
      taskId: task.id,
      type: "solve",
      problem: {
        id: task.problem.id,
        title: task.problem.title,
        statement: task.problem.statement,
        hints: task.problem.hints,
      },
      instruction: getSolveInstructions(task.problem.title),
      freshContextRequired: false,
    };
  }

  // Aggregate task - fetch sources
  const payload = task.payload as { sourceIds: string[]; isFinal: boolean };
  const sources = await prisma.solution.findMany({
    where: {
      id: { in: payload.sourceIds },
    },
    include: {
      agent: { select: { name: true } },
    },
  });

  const aggregationSources: AggregationSource[] = sources.map((s) => ({
    id: s.id,
    content: s.content,
    answer: s.answer,
    confidence: s.confidence,
    agentName: s.agent.name,
    level: s.level,
  }));

  return {
    taskId: task.id,
    type: "aggregate",
    problem: {
      id: task.problem.id,
      title: task.problem.title,
      statement: task.problem.statement,
      hints: task.problem.hints,
    },
    level: task.level || 2,
    sources: aggregationSources,
    instruction: getAggregationInstructions(
      task.level || 2,
      aggregationSources.length,
      payload.isFinal,
    ),
    freshContextRequired: true,
  };
}

export async function submitTaskResult(
  taskId: string,
  agentId: string,
  result: {
    content: string;
    answer?: string;
    confidence?: number;
  },
): Promise<{ success: boolean; solutionId?: string; error?: string }> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { problem: true },
  });

  if (!task) {
    return { success: false, error: "Task not found" };
  }

  if (task.agentId !== agentId) {
    return { success: false, error: "Task belongs to different agent" };
  }

  if (task.status === "completed") {
    return { success: false, error: "Task already completed" };
  }

  // Validate that the task's problem is the current active problem
  if (!task.problem.isActive) {
    return {
      success: false,
      error:
        "Cannot submit solution for inactive problem. This problem has been closed or replaced.",
    };
  }

  const payload = task.payload as { sourceIds?: string[]; isFinal?: boolean };

  // Create solution
  const solution = await prisma.solution.create({
    data: {
      agentId,
      problemId: task.problemId,
      level: task.type === "solve" ? 1 : task.level || 2,
      content: result.content,
      answer: result.answer || null,
      confidence: result.confidence || null,
      parentIds: payload.sourceIds || [],
      isFinal: payload.isFinal || false,
    },
  });

  // Update claimed solutions to point to actual solution (not task)
  if (payload.sourceIds && payload.sourceIds.length > 0) {
    await prisma.solution.updateMany({
      where: {
        id: { in: payload.sourceIds },
      },
      data: {
        aggregatedIntoId: solution.id,
        aggregatedAt: new Date(),
      },
    });
  }

  // Mark task as completed
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  });

  return { success: true, solutionId: solution.id };
}
