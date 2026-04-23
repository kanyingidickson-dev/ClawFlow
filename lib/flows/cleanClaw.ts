import { FlowDefinition, FlowResult } from "../engine/types";

/**
 * Clean-Claw: Text normalization and formatting engine
 * Trims whitespace, normalizes spacing, extracts stats and key phrases
 */

function extractKeyPhrases(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const freq: Record<string, number> = {};

  for (const word of words) {
    const clean = word.replace(/[^a-z0-9]/g, "");
    if (clean.length > 4) {
      freq[clean] = (freq[clean] || 0) + 1;
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

export const cleanClaw: FlowDefinition = {
  id: "clean",
  name: "Clean-Claw",
  description: "Normalizes and formats messy text with stats and key phrase extraction",
  example: "  this   is   some     messy   text   with   lots    of   extra   spaces  ",
  icon: "✨",
  color: "#06b6d4",
  category: "text",

  execute(input: string): FlowResult {
    const steps: string[] = [
      "Reading raw input",
      "Trimming leading/trailing whitespace",
      "Normalizing internal spacing",
      "Cleaning line breaks",
      "Computing text statistics",
      "Extracting key phrases",
      "Formatting output",
    ];

    const cleaned = input
      .trim()
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\s+$/gm, "");

    const sentences = cleaned
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const words = cleaned.split(/\s+/).filter((w) => w.length > 0);

    return {
      steps,
      result: {
        cleaned_text: cleaned,
        pipelineInput: cleaned,
        stats: {
          characters: cleaned.length,
          words: words.length,
          sentences: sentences.length,
          lines: cleaned.split("\n").length,
          reduction: `${Math.round((1 - cleaned.length / input.length) * 100)}% size reduction`,
        },
        key_phrases: extractKeyPhrases(cleaned),
      },
    };
  },
};
