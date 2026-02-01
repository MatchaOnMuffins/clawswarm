import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { config } from "./config";
import { agentsRouter } from "./routes/agents";
import { problemsRouter } from "./routes/problems";
import { tasksRouter } from "./routes/tasks";
import { solutionsRouter } from "./routes/solutions";
import { aggregationsRouter } from "./routes/aggregations";

export const prisma = new PrismaClient();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1/agents", agentsRouter);
app.use("/api/v1/problems", problemsRouter);
app.use("/api/v1/tasks", tasksRouter);
app.use("/api/v1/solutions", solutionsRouter);
app.use("/api/v1/aggregations", aggregationsRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

async function main() {
  await prisma.$connect();
  console.log("Connected to database");

  app.listen(config.port, () => {
    console.log(`ClawSwarm API running on http://localhost:${config.port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
