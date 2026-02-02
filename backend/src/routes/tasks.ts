import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { getNextTask, submitTaskResult } from "../services/TaskAssigner";
import { formatSourcesForAgent } from "../services/AggregationInstructions";

export const tasksRouter = Router();

// Get next task for agent
tasksRouter.get(
  "/next",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const task = await getNextTask(req.agent!.id);

      if (!task) {
        return res.json({
          success: true,
          status: "no_task_available",
          message:
            "No tasks available. Either waiting for more solutions to aggregate, or you have completed all available tasks.",
          retryAfterMs: 300000,
        });
      }

      const response: Record<string, unknown> = {
        success: true,
        status: "task_assigned",
        task: {
          id: task.taskId,
          type: task.type,
          problem: task.problem,
        },
        instruction: task.instruction,
        freshContextRequired: task.freshContextRequired,
      };

      // Add aggregation-specific fields
      if (task.type === "aggregate") {
        response.task = {
          ...(response.task as object),
          level: task.level,
          sourceCount: task.sources?.length,
        };
        response.sources = task.sources;
        response.sourcesFormatted = formatSourcesForAgent(task.sources || []);
      }

      return res.json(response);
    } catch (error) {
      console.error("Get next task error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get next task",
      });
    }
  },
);

// Submit task result
tasksRouter.post(
  "/:id/submit",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { content, answer, confidence } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: "Content is required",
          hint: "Provide your reasoning/solution in the content field",
        });
      }

      const result = await submitTaskResult(id, req.agent!.id, {
        content,
        answer,
        confidence:
          typeof confidence === "number"
            ? Math.max(0, Math.min(1, confidence))
            : undefined,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      return res.json({
        success: true,
        message: "Task completed successfully",
        solutionId: result.solutionId,
        nextStep: "Call GET /api/v1/tasks/next for your next task",
      });
    } catch (error) {
      console.error("Submit task error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to submit task",
      });
    }
  },
);

// Get task status
tasksRouter.get(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const { prisma } = await import("../index");
      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          problem: { select: { id: true, title: true } },
        },
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: "Task not found",
        });
      }

      return res.json({
        success: true,
        task: {
          id: task.id,
          type: task.type,
          level: task.level,
          status: task.status,
          problem: task.problem,
          createdAt: task.createdAt,
          completedAt: task.completedAt,
        },
      });
    } catch (error) {
      console.error("Get task error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get task",
      });
    }
  },
);
