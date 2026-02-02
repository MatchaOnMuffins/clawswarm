import { Router, Request, Response } from "express";
import { prisma } from "../index";

export const solutionsRouter = Router();

// Get L1 solutions for current problem
solutionsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { problemId, limit = "50", offset = "0" } = req.query;

    // Get problem ID (use provided or get current active)
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

    const solutions = await prisma.solution.findMany({
      where: {
        problemId: targetProblemId,
        level: 1,
      },
      include: {
        agent: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    });

    const total = await prisma.solution.count({
      where: {
        problemId: targetProblemId,
        level: 1,
      },
    });

    return res.json({
      success: true,
      solutions: solutions.map((s) => ({
        id: s.id,
        agent: s.agent,
        content: s.content,
        answer: s.answer,
        confidence: s.confidence,
        createdAt: s.createdAt,
        isAggregated: s.aggregatedIntoId !== null,
      })),
      pagination: {
        total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    console.error("Get solutions error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get solutions",
    });
  }
});

// Get a specific solution (only for active problems)
solutionsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const solution = await prisma.solution.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true } },
        problem: { select: { id: true, title: true, isActive: true } },
      },
    });

    if (!solution) {
      return res.status(404).json({
        success: false,
        error: "Solution not found",
      });
    }

    // Only return solutions for active problems
    if (!solution.problem.isActive) {
      return res.status(404).json({
        success: false,
        error: "Solution not found or problem not active",
      });
    }

    // Get parent solutions if this is an aggregation
    let parents: Array<{ id: string; level: number; agentName: string }> = [];
    if (solution.parentIds.length > 0) {
      const parentSolutions = await prisma.solution.findMany({
        where: { id: { in: solution.parentIds } },
        include: { agent: { select: { name: true } } },
      });
      parents = parentSolutions.map((p) => ({
        id: p.id,
        level: p.level,
        agentName: p.agent.name,
      }));
    }

    // Get child (aggregated into) if exists
    let aggregatedInto: { id: string; level: number } | null = null;
    if (solution.aggregatedIntoId) {
      const child = await prisma.solution.findUnique({
        where: { id: solution.aggregatedIntoId },
        select: { id: true, level: true },
      });
      if (child) {
        aggregatedInto = child;
      }
    }

    return res.json({
      success: true,
      solution: {
        id: solution.id,
        level: solution.level,
        agent: solution.agent,
        problem: {
          id: solution.problem.id,
          title: solution.problem.title,
        },
        content: solution.content,
        answer: solution.answer,
        confidence: solution.confidence,
        isFinal: solution.isFinal,
        createdAt: solution.createdAt,
        parents,
        aggregatedInto,
      },
    });
  } catch (error) {
    console.error("Get solution error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get solution",
    });
  }
});
