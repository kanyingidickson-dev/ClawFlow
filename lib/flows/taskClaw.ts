import { FlowDefinition, FlowResult } from "../engine/types";

/**
 * Task-Claw: Parses input into structured tasks
 * Removes noise words, detects priority and category,
 * and produces an actionable task list with tracking
 */

const NOISE_WORDS = new Set([
  "and", "the", "a", "to", "for", "with", "on", "in", "of", "is", "it",
  "be", "as", "at", "by", "or", "an", "do", "if", "so", "up", "but",
]);

const PRIORITY_KEYWORDS = new Set([
  "urgent", "critical", "important", "asap", "immediately", "priority",
  "blocker", "hotfix", "emergency",
]);

const CATEGORY_MAP: Record<string, string[]> = {
  design: ["design", "ui", "ux", "wireframe", "mockup", "figma", "layout", "style", "css"],
  development: ["build", "develop", "code", "implement", "create", "setup", "configure", "integrate"],
  testing: ["test", "qa", "debug", "fix", "verify", "validate", "check"],
  deployment: ["deploy", "release", "publish", "launch", "ship", "push", "ci", "cd"],
  planning: ["plan", "research", "analyze", "review", "document", "spec", "architecture"],
};

function detectPriority(text: string): "high" | "medium" | "low" {
  const lower = text.toLowerCase();
  if ([...PRIORITY_KEYWORDS].some((kw) => lower.includes(kw))) return "high";
  if (lower.includes("!") || lower.includes("now")) return "medium";
  return "low";
}

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "general";
}

export const taskClaw: FlowDefinition = {
  id: "task",
  name: "Task-Claw",
  description: "Breaks input into actionable tasks with priority detection and category tagging",
  example: "Build landing page, setup auth, deploy app urgently",
  icon: "📋",
  color: "#10b981",
  category: "planning",

  execute(input: string): FlowResult {
    const steps: string[] = [
      "Parsing raw input",
      "Extracting task items",
      "Filtering noise words",
      "Detecting priorities",
      "Classifying categories",
      "Structuring output",
    ];

    const items = input
      .split(/[,.\n;]+/)
      .map((item) => item.trim())
      .filter((item) => item.length >= 3)
      .map((item) => {
        const words = item.split(/\s+/);
        const filtered = words.filter(
          (word) => !NOISE_WORDS.has(word.toLowerCase())
        );
        return filtered.join(" ") || item;
      });

    const tasks = items.map((item, index) => ({
      id: index + 1,
      task: item,
      priority: detectPriority(item),
      category: detectCategory(item),
      done: false,
    }));

    const tasksText = tasks.map(t => `- ${t.task} (${t.priority} priority, ${t.category})`).join("\n");

    return {
      steps,
      result: {
        tasks,
        pipelineInput: tasksText,
        count: tasks.length,
        summary: {
          high_priority: tasks.filter((t) => t.priority === "high").length,
          categories: [...new Set(tasks.map((t) => t.category))],
        },
      },
    };
  },
};
