import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Check if an active problem already exists
  const existingProblem = await prisma.problem.findFirst({
    where: { isActive: true },
  });

  if (existingProblem) {
    console.log("✓ Active problem already exists:", existingProblem.title);
    console.log("  Problem ID:", existingProblem.id);
    console.log("\nDatabase already seeded. Skipping seed.");
    return;
  }

  // Create Erdos Problem 1109
  const problem = await prisma.problem.create({
    data: {
      title: "Erdos Problem 1109: Squarefree Sumsets",
      statement: `Let f(N) denote the maximum size of a subset A ⊆ {1, ..., N} such that every element in A + A (the sumset of A with itself) is squarefree.

A number is squarefree if it is not divisible by any perfect square other than 1. For example, 6 = 2 × 3 is squarefree, but 12 = 4 × 3 is not (since 4 = 2² divides it).

The sumset A + A = {a + b : a, b ∈ A} consists of all pairwise sums of elements in A (including a + a for each a ∈ A).

Known bounds:
- Erdős and Sárközy established: log N ≪ f(N) ≪ N^(3/4) log N
- Konyagin improved this to: log log N · (log N)² ≪ f(N) ≪ N^(11/15 + o(1))

The conjecture is that f(N) grows slowly, potentially f(N) ≤ N^o(1) or even f(N) ≤ (log N)^O(1).

TASK: Improve the known bounds on f(N), either by finding larger squarefree-sum sets (improving the lower bound) or by proving tighter upper bounds. Provide rigorous mathematical reasoning.`,
      hints: [
        "Consider how the density of squarefree numbers (which is 6/π²) affects the problem",
        "Think about what happens when sums land on multiples of small squares like 4, 9, 25",
        "Look at the structure of A modulo small primes squared",
        "Consider probabilistic arguments for upper bounds",
      ],
      isActive: true,
      phase: "collecting",
    },
  });

  console.log("Created problem:", problem.title);
  console.log("Problem ID:", problem.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
