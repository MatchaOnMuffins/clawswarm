import { Router, Request, Response } from "express";
import { prisma } from "../index";

export const problemsRouter = Router();

// Get current active problem
problemsRouter.get("/current", async (req: Request, res: Response) => {
  try {
    const problem = await prisma.problem.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: "No active problem",
      });
    }

    // Get stats
    const [l1Count, totalAggregations, agentCount] = await Promise.all([
      prisma.solution.count({
        where: { problemId: problem.id, level: 1 },
      }),
      prisma.solution.count({
        where: { problemId: problem.id, level: { gt: 1 } },
      }),
      prisma.solution.groupBy({
        by: ["agentId"],
        where: { problemId: problem.id },
      }),
    ]);

    // Get highest level
    const highestLevel = await prisma.solution.aggregate({
      where: { problemId: problem.id },
      _max: { level: true },
    });

    return res.json({
      success: true,
      problem: {
        id: problem.id,
        title: problem.title,
        statement: problem.statement,
        hints: problem.hints,
        phase: problem.phase,
        createdAt: problem.createdAt,
      },
      stats: {
        l1Solutions: l1Count,
        totalAggregations,
        participatingAgents: agentCount.length,
        highestLevel: highestLevel._max.level || 0,
      },
    });
  } catch (error) {
    console.error("Get current problem error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get problem",
    });
  }
});

// Create a new problem (admin endpoint - no auth for simplicity)
problemsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { title, statement, hints } = req.body;

    if (!title || !statement) {
      return res.status(400).json({
        success: false,
        error: "Title and statement are required",
      });
    }

    // Deactivate all existing problems
    await prisma.problem.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new problem
    const problem = await prisma.problem.create({
      data: {
        title,
        statement,
        hints: hints || [],
        isActive: true,
      },
    });

    return res.status(201).json({
      success: true,
      problem: {
        id: problem.id,
        title: problem.title,
        statement: problem.statement,
        hints: problem.hints,
        phase: problem.phase,
      },
    });
  } catch (error) {
    console.error("Create problem error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create problem",
    });
  }
});

// Get problem by ID
problemsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const problem = await prisma.problem.findUnique({
      where: { id },
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: "Problem not found",
      });
    }

    return res.json({
      success: true,
      problem: {
        id: problem.id,
        title: problem.title,
        statement: problem.statement,
        hints: problem.hints,
        phase: problem.phase,
        isActive: problem.isActive,
        createdAt: problem.createdAt,
      },
    });
  } catch (error) {
    console.error("Get problem error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get problem",
    });
  }
});

// Update problem phase (admin)
problemsRouter.patch("/:id/phase", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { phase } = req.body;

    if (!["collecting", "aggregating", "finalized"].includes(phase)) {
      return res.status(400).json({
        success: false,
        error: "Invalid phase. Must be: collecting, aggregating, or finalized",
      });
    }

    const problem = await prisma.problem.update({
      where: { id },
      data: { phase },
    });

    return res.json({
      success: true,
      problem: {
        id: problem.id,
        title: problem.title,
        phase: problem.phase,
      },
    });
  } catch (error) {
    console.error("Update phase error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update phase",
    });
  }
});
