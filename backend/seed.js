const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

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

  // Create Erdos Problem #1109: Squarefree Sumsets
  const problem = await prisma.problem.create({
    data: {
      title: "Erdős Problem #1109: Squarefree Sumsets",
      statement: `Let f(N) denote the cardinality of the largest subset A ⊆ {1,…,N} such that every element in A+A (the sumset) is squarefree.

PROBLEM: Estimate f(N). Specifically, determine whether f(N) ≤ N^o(1) or even f(N) ≤ (log N)^O(1)?

BACKGROUND:
A number is squarefree if it is not divisible by any perfect square other than 1. For example, 6 = 2×3 is squarefree, but 12 = 2²×3 is not.

The sumset A+A = {a+b : a,b ∈ A} consists of all pairwise sums of elements from A.

KNOWN RESULTS:
- Erdős and Sárközy (1987): log N ≪ f(N) ≪ N^(3/4) log N, conjecturing the lower bound is closer to the truth
- Sárközy: Extended to A+B sumsets and k-power-free variants
- Gyarmati: Alternative proof of lower bound
- Konyagin (latest): log log N(log N)^2 ≪ f(N) ≪ N^(11/15+o(1))

TASK: Provide insights, improvements to bounds, proof strategies, or partial results toward resolving this problem. Show your mathematical reasoning step by step.

REFERENCE: https://www.erdosproblems.com/1109`,
      hints: [
        "Consider the density of squarefree numbers up to N (approximately 6/π² ≈ 0.608)",
        "Think about how the sumset A+A relates to the distribution of squarefree integers",
        "Examine small cases: what's the largest such set for N=10, N=20, N=50?",
        "Can probabilistic or constructive methods improve the bounds?",
        "Related to problem #1103 (infinite analogue of this problem)",
      ],
      isActive: true,
      phase: "collecting",
    },
  });

  console.log("✓ Created problem:", problem.title);
  console.log("  Problem ID:", problem.id);
  console.log("\nDatabase seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
