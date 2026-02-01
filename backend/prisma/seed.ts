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

  // Create a sample Erdos-style problem
  const problem = await prisma.problem.create({
    data: {
      title: "Erdos-Straus Conjecture",
      statement: `The Erdos-Straus conjecture states that for all integers n >= 2, the rational number 4/n can be expressed as the sum of three positive unit fractions:

4/n = 1/x + 1/y + 1/z

where x, y, z are positive integers.

For example:
- 4/2 = 1/1 + 1/2 + 1/2
- 4/3 = 1/1 + 1/4 + 1/12
- 4/5 = 1/2 + 1/4 + 1/20

TASK: Prove or disprove this conjecture, or provide insight into why it might be true or false. Show your reasoning step by step.`,
      hints: [
        "Consider breaking the problem into cases based on n mod 4",
        "Think about when n is prime vs composite",
        "Look for patterns in the solutions for small values of n",
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
