import { FlowDefinition, FlowResult } from "../engine/types";

export const diffClaw: FlowDefinition = {
  id: "diff",
  name: "Diff-Claw",
  description: "Compares two text blocks separated by ---DIFF---",
  example: "apple orange banana\n---DIFF---\napple grape banana",
  icon: "🔄",
  color: "#06b6d4",
  category: "dev",

  execute(input: string): FlowResult {
    const steps: string[] = ["Splitting text by ---DIFF--- separator"];
    
    const parts = input.split('---DIFF---');
    if (parts.length !== 2) {
      return {
        steps: ["Error: Input must contain exactly one ---DIFF--- separator"],
        result: { error: "Please separate original and new text with '---DIFF---'." }
      };
    }
    
    const textA = parts[0].trim().split(/\s+/);
    const textB = parts[1].trim().split(/\s+/);
    
    steps.push("Comparing word sets");
    
    const setA = new Set(textA);
    const setB = new Set(textB);
    
    const added = [...setB].filter(w => !setA.has(w));
    const removed = [...setA].filter(w => !setB.has(w));
    const unchanged = [...setA].filter(w => setB.has(w));
    
    steps.push("Generating diff summary");

    return {
      steps,
      result: {
        added,
        removed,
        unchanged_count: unchanged.length,
        similarity_score: Math.round((unchanged.length / Math.max(setA.size, setB.size)) * 100) || 0
      },
    };
  },
};
