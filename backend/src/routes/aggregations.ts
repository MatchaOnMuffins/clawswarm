import { Router, Request, Response } from "express";
import { prisma } from "../index";

export const aggregationsRouter = Router();

// Get aggregations (level > 1) for current problem
aggregationsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { problemId, level } = req.query;

    // Get problem ID
    let targetProblemId = problemId as string | undefined;
    if (!targetProblemId) {
      const activeProblem = await prisma.problem.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      if (!activeProblem) {
        return res.status(404).json({
          success: false,
          error: "No active problem",
        });
      }
      targetProblemId = activeProblem.id;
    }

    const whereClause: Record<string, unknown> = {
      problemId: targetProblemId,
      level: { gt: 1 },
    };

    if (level) {
      whereClause.level = parseInt(level as string, 10);
    }

    const aggregations = await prisma.solution.findMany({
      where: whereClause,
      include: {
        agent: { select: { id: true, name: true } },
      },
      orderBy: [{ level: "desc" }, { createdAt: "desc" }],
    });

    // Group by level
    const byLevel: Record<
      number,
      Array<{
        id: string;
        agent: { id: string; name: string };
        content: string;
        answer: string | null;
        confidence: number | null;
        parentCount: number;
        isFinal: boolean;
        createdAt: Date;
      }>
    > = {};

    for (const agg of aggregations) {
      if (!byLevel[agg.level]) {
        byLevel[agg.level] = [];
      }
      byLevel[agg.level].push({
        id: agg.id,
        agent: agg.agent,
        content: agg.content,
        answer: agg.answer,
        confidence: agg.confidence,
        parentCount: agg.parentIds.length,
        isFinal: agg.isFinal,
        createdAt: agg.createdAt,
      });
    }

    // Get level stats
    const levelStats = await prisma.solution.groupBy({
      by: ["level"],
      where: { problemId: targetProblemId },
      _count: { id: true },
    });

    return res.json({
      success: true,
      aggregationsByLevel: byLevel,
      levelStats: levelStats.map((s) => ({
        level: s.level,
        count: s._count.id,
      })),
    });
  } catch (error) {
    console.error("Get aggregations error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get aggregations",
    });
  }
});

// Get final aggregation
aggregationsRouter.get("/final", async (req: Request, res: Response) => {
  try {
    const { problemId } = req.query;

    // Get problem ID
    let targetProblemId = problemId as string | undefined;
    if (!targetProblemId) {
      const activeProblem = await prisma.problem.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      if (!activeProblem) {
        return res.status(404).json({
          success: false,
          error: "No active problem",
        });
      }
      targetProblemId = activeProblem.id;
    }

    const finalSolution = await prisma.solution.findFirst({
      where: {
        problemId: targetProblemId,
        isFinal: true,
      },
      include: {
        agent: { select: { id: true, name: true } },
        problem: { select: { id: true, title: true } },
      },
    });

    if (!finalSolution) {
      // Return highest level aggregation instead
      const highestLevel = await prisma.solution.findFirst({
        where: { problemId: targetProblemId },
        orderBy: { level: "desc" },
        include: {
          agent: { select: { id: true, name: true } },
          problem: { select: { id: true, title: true } },
        },
      });

      if (!highestLevel || highestLevel.level === 1) {
        return res.json({
          success: true,
          final: null,
          message: "No aggregation completed yet",
        });
      }

      return res.json({
        success: true,
        final: null,
        highestLevel: {
          id: highestLevel.id,
          level: highestLevel.level,
          agent: highestLevel.agent,
          content: highestLevel.content,
          answer: highestLevel.answer,
          confidence: highestLevel.confidence,
          createdAt: highestLevel.createdAt,
        },
        message: "Final not yet determined. Showing highest level aggregation.",
      });
    }

    return res.json({
      success: true,
      final: {
        id: finalSolution.id,
        level: finalSolution.level,
        agent: finalSolution.agent,
        problem: finalSolution.problem,
        content: finalSolution.content,
        answer: finalSolution.answer,
        confidence: finalSolution.confidence,
        createdAt: finalSolution.createdAt,
      },
    });
  } catch (error) {
    console.error("Get final error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get final aggregation",
    });
  }
});

// Get aggregation hierarchy tree
aggregationsRouter.get("/tree", async (req: Request, res: Response) => {
  try {
    const { problemId } = req.query;

    // Get problem ID
    let targetProblemId = problemId as string | undefined;
    if (!targetProblemId) {
      const activeProblem = await prisma.problem.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      if (!activeProblem) {
        return res.status(404).json({
          success: false,
          error: "No active problem",
        });
      }
      targetProblemId = activeProblem.id;
    }

    // Get all solutions for this problem
    const allSolutions = await prisma.solution.findMany({
      where: { problemId: targetProblemId },
      include: {
        agent: { select: { id: true, name: true } },
      },
      orderBy: { level: "asc" },
    });

    // Build tree structure
    type TreeNode = {
      id: string;
      level: number;
      agent: { id: string; name: string };
      answer: string | null;
      confidence: number | null;
      isFinal: boolean;
      children: TreeNode[];
    };

    const nodesById = new Map<string, TreeNode>();

    // Create nodes
    for (const sol of allSolutions) {
      nodesById.set(sol.id, {
        id: sol.id,
        level: sol.level,
        agent: sol.agent,
        answer: sol.answer,
        confidence: sol.confidence,
        isFinal: sol.isFinal,
        children: [],
      });
    }

    // Find roots (L1 solutions)
    const roots = allSolutions
      .filter((s) => s.level === 1)
      .map((s) => nodesById.get(s.id)!);

    // Get level counts
    const levelCounts: Record<number, number> = {};
    for (const sol of allSolutions) {
      levelCounts[sol.level] = (levelCounts[sol.level] || 0) + 1;
    }

    return res.json({
      success: true,
      tree: {
        roots,
        levelCounts,
        totalSolutions: allSolutions.length,
      },
    });
  } catch (error) {
    console.error("Get tree error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get aggregation tree",
    });
  }
});
