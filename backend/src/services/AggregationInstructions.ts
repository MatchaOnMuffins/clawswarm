export interface AggregationSource {
  id: string;
  content: string;
  answer: string | null;
  confidence: number | null;
  agentName: string;
  level: number;
}

export function getSolveInstructions(problemTitle: string): string {
  // Generate a large random seed to encourage output diversity
  const seed = Math.floor(Math.random() * 1e15);

  return `You are solving the following mathematical problem: "${problemTitle}"

INSTRUCTIONS:
1. Read the problem statement carefully
2. Reason through the problem step by step
3. Show your complete reasoning process
4. Arrive at a final answer with confidence level (0-1)

Submit your solution with:
- content: Your complete reasoning and solution steps
- answer: Your final answer
- confidence: How confident you are (0.0 to 1.0)

[seed: ${seed}]`;
}

export function getAggregationInstructions(
  level: number,
  sourceCount: number,
  isFinal: boolean = false
): string {
  if (isFinal) {
    return `You are producing the FINAL ANSWER for this problem.

START WITH A FRESH PERSPECTIVE. Do not assume any prior context.

You have ${sourceCount} high-level aggregated summaries to synthesize.

YOUR TASK:
1. Review all provided summaries carefully
2. Identify the consensus answer (if any)
3. Resolve any remaining conflicts using mathematical rigor
4. Produce the definitive final answer with complete justification

REQUIREMENTS:
- Provide a clear, definitive answer
- Include complete reasoning chain
- Acknowledge any remaining uncertainty
- This is the AUTHORITATIVE response

Submit with:
- content: Complete synthesis and final reasoning
- answer: The definitive final answer
- confidence: Overall confidence (0.0 to 1.0)`;
  }

  if (level === 2) {
    return `You are synthesizing ${sourceCount} individual solutions to a math problem.

START WITH A FRESH PERSPECTIVE. Do not assume any prior context.

YOUR TASK:
1. Analyze these ${sourceCount} solutions
2. Identify common approaches and the most frequent answer
3. Note any creative or unique approaches worth preserving
4. Flag any contradictions or errors in reasoning
5. Produce a unified solution that incorporates the best elements

REQUIREMENTS:
- Identify the most common answer and assess overall confidence
- Preserve valuable insights from individual solutions
- Resolve conflicts where possible
- Create a stronger, synthesized solution

Submit with:
- content: Your synthesized reasoning combining the best elements
- answer: The consensus answer (or best-supported answer)
- confidence: Aggregated confidence (0.0 to 1.0)`;
  }

  // Level 3+
  return `You are performing meta-synthesis of ${sourceCount} aggregated summaries (Level ${level - 1} aggregations).

START WITH A FRESH PERSPECTIVE. These are already-synthesized views.

YOUR TASK:
1. Compare the ${sourceCount} aggregated summaries
2. Weight summaries by their confidence scores
3. Identify convergent vs divergent conclusions
4. Resolve conflicts using mathematical rigor
5. Produce an increasingly refined synthesis

REQUIREMENTS:
- Build toward consensus
- Preserve dissenting views with merit
- Increase precision of the answer
- Reduce remaining uncertainty

Submit with:
- content: Higher-level synthesis of the summaries
- answer: Refined consensus answer
- confidence: Updated confidence (0.0 to 1.0)`;
}

export function formatSourcesForAgent(sources: AggregationSource[]): string {
  return sources
    .map(
      (s, i) => `
--- Solution ${i + 1} (from ${s.agentName}, Level ${s.level}) ---
${s.content}
${s.answer ? `Answer: ${s.answer}` : ''}
${s.confidence !== null ? `Confidence: ${s.confidence}` : ''}
---`
    )
    .join('\n');
}
