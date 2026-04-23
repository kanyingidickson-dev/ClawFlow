import { FlowDefinition, FlowResult } from "../engine/types";

/**
 * Brain-Claw: Converts raw ideas into structured product plans
 * Extracts title, tags, target audience, complexity estimate,
 * and generates context-aware next steps
 */

const AUDIENCE_MAP: Record<string, string[]> = {
  students: ["student", "university", "college", "school", "education", "learn", "study", "campus"],
  developers: ["developer", "dev", "code", "programming", "software", "api", "tool", "engineer"],
  businesses: ["business", "company", "enterprise", "startup", "saas", "b2b", "revenue", "profit"],
  consumers: ["user", "people", "consumer", "everyone", "public", "social", "community"],
  healthcare: ["health", "medical", "patient", "doctor", "clinic", "hospital", "wellness"],
  creators: ["creator", "artist", "designer", "content", "media", "video", "music", "writing"],
};

const NEXT_STEPS_MAP: Record<string, string[]> = {
  marketplace: ["Define listing categories", "Design trust/safety system", "Build payment flow", "Plan seller onboarding"],
  app: ["Create wireframes", "Define core user flow", "Build MVP with key features", "Set up analytics"],
  platform: ["Map stakeholder roles", "Design permission model", "Build core API", "Plan scaling strategy"],
  tool: ["Define input/output contract", "Build CLI or API first", "Add configuration options", "Write usage docs"],
  default: ["Validate the idea with 5 potential users", "Sketch the core user flow", "Build a minimal prototype", "Gather feedback and iterate"],
};

function extractTitle(input: string): string {
  // Use first clause or sentence, capped at 8 words, trim trailing noise
  const noise = new Set(["and", "the", "a", "to", "for", "with", "on", "in", "of", "or"]);
  const firstClause = input.split(/[,.\n!?;]/)[0].trim();
  let words = firstClause.split(/\s+/).slice(0, 8);
  while (words.length > 1 && noise.has(words[words.length - 1].toLowerCase())) {
    words = words.slice(0, -1);
  }
  return words.join(" ");
}

function detectAudience(input: string): string[] {
  const lower = input.toLowerCase();
  const audiences: string[] = [];
  for (const [audience, keywords] of Object.entries(AUDIENCE_MAP)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      audiences.push(audience);
    }
  }
  return audiences.length > 0 ? audiences : ["general"];
}

function generateNextSteps(input: string): string[] {
  const lower = input.toLowerCase();
  for (const [key, steps] of Object.entries(NEXT_STEPS_MAP)) {
    if (lower.includes(key)) return steps;
  }
  return NEXT_STEPS_MAP.default;
}

function estimateComplexity(input: string): { level: string; score: number; reason: string } {
  const words = input.split(/\s+/).length;
  const hasIntegration = /integrat|connect|sync|api|third.party/i.test(input);
  const hasScale = /scale|million|enterprise|global|distributed/i.test(input);
  const hasAI = /ai|machine.learning|ml|neural|model/i.test(input);

  let score = Math.min(words * 2, 40);
  if (hasIntegration) score += 20;
  if (hasScale) score += 25;
  if (hasAI) score += 15;

  const level = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  const reasons: string[] = [];
  if (hasIntegration) reasons.push("requires integrations");
  if (hasScale) reasons.push("needs scale considerations");
  if (hasAI) reasons.push("involves AI/ML components");
  if (words > 15) reasons.push("complex description");

  return {
    level,
    score: Math.min(score, 100),
    reason: reasons.length > 0 ? reasons.join(", ") : "straightforward scope",
  };
}

export const brainClaw: FlowDefinition = {
  id: "brain",
  name: "Brain-Claw",
  description: "Converts raw ideas into structured product plans with audience and complexity analysis",
  example: "Build a marketplace for students to buy and sell notes",
  icon: "🧠",
  color: "#a855f7",
  category: "planning",

  execute(input: string): FlowResult {
    const steps: string[] = [
      "Parsing raw idea",
      "Extracting title",
      "Analyzing target audience",
      "Computing complexity estimate",
      "Generating keyword tags",
      "Building actionable next steps",
      "Assembling product plan",
    ];

    const words = input.split(/\s+/).filter(Boolean);

    const tags = words
      .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""))
      .filter((word) => word.length > 3)
      .filter((word, i, arr) => arr.indexOf(word) === i) // deduplicate
      .slice(0, 6);

    const nextSteps = generateNextSteps(input);

    return {
      steps,
      result: {
        title: extractTitle(input),
        description: input,
        target_audience: detectAudience(input),
        tags,
        complexity: estimateComplexity(input),
        next_steps: nextSteps,
        pipelineInput: nextSteps.join(". "),
      },
    };
  },
};
