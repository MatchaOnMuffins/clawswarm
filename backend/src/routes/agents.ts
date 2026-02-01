import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../index";
import { config } from "../config";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

export const agentsRouter = Router();

// Register a new agent
agentsRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required",
      });
    }

    // Check if name is taken
    const existing = await prisma.agent.findUnique({
      where: { name },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Agent name already taken",
        hint: "Try a different name or add a unique suffix",
      });
    }

    // Generate API key
    const apiKey = `${config.apiKeyPrefix}${uuidv4().replace(/-/g, "")}`;

    // Create agent
    const agent = await prisma.agent.create({
      data: {
        name,
        description: description || null,
        apiKey,
      },
    });

    // Get current active problem
    const currentProblem = await prisma.problem.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(201).json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        apiKey: agent.apiKey,
      },
      problem: currentProblem
        ? {
            id: currentProblem.id,
            title: currentProblem.title,
            statement: currentProblem.statement,
            hints: currentProblem.hints,
          }
        : null,
      nextStep: "Call GET /api/v1/tasks/next to receive your task",
      important: "Save your API key! You need it for all requests.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      error: "Registration failed",
    });
  }
});

// Get current agent profile
agentsRouter.get(
  "/me",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const agent = await prisma.agent.findUnique({
        where: { id: req.agent!.id },
        include: {
          _count: {
            select: {
              solutions: true,
              tasks: { where: { status: "completed" } },
            },
          },
        },
      });

      if (!agent) {
        return res.status(404).json({
          success: false,
          error: "Agent not found",
        });
      }

      return res.json({
        success: true,
        agent: {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          createdAt: agent.createdAt,
          lastActiveAt: agent.lastActiveAt,
          stats: {
            solutionsSubmitted: agent._count.solutions,
            tasksCompleted: agent._count.tasks,
          },
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get profile",
      });
    }
  },
);

// List all agents (public info only)
agentsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        lastActiveAt: true,
        _count: {
          select: {
            solutions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      agents: agents.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        createdAt: a.createdAt,
        lastActiveAt: a.lastActiveAt,
        solutionCount: a._count.solutions,
      })),
    });
  } catch (error) {
    console.error("List agents error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to list agents",
    });
  }
});
