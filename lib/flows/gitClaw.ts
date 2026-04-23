import { FlowDefinition, FlowResult } from "../engine/types";

export const gitClaw: FlowDefinition = {
  id: "git",
  name: "Git-Claw",
  description: "Analyzes code diffs and generates structured commit messages",
  example: "+\tconst count = 0;\n-\tvar count = null;\n+\tconsole.log(count);",
  icon: "🐙",
  color: "#f43f5e", // rose
  category: "dev",

  execute(input: string): FlowResult {
    const steps: string[] = ["Parsing git diff format"];
    
    const lines = input.split('\n');
    let additions = 0;
    let deletions = 0;
    const modifiedFiles = new Set<string>();
    
    steps.push("Analyzing line additions and deletions");
    
    lines.forEach(line => {
      if (line.startsWith('+') && !line.startsWith('+++')) additions++;
      else if (line.startsWith('-') && !line.startsWith('---')) deletions++;
      else if (line.startsWith('diff --git a/')) {
        const fileMatch = line.match(/b\/(.+)/);
        if (fileMatch) modifiedFiles.add(fileMatch[1]);
      }
    });

    if (modifiedFiles.size === 0) {
      modifiedFiles.add("unknown_file");
    }

    steps.push("Categorizing changes (feat/fix/refactor)");
    
    const lowerInput = input.toLowerCase();
    let type = "chore";
    if (lowerInput.includes("error") || lowerInput.includes("fix") || lowerInput.includes("bug")) {
      type = "fix";
    } else if (lowerInput.includes("function") || lowerInput.includes("class") || lowerInput.includes("export")) {
      if (additions > deletions * 2) type = "feat";
      else type = "refactor";
    } else if (lowerInput.includes("style") || lowerInput.includes("css")) {
      type = "style";
    }

    steps.push("Generating commit message variations");

    const filesArray = Array.from(modifiedFiles);
    const mainFile = filesArray[0].split('/').pop() || "files";
    
    const summary = `${type}: update ${mainFile}`;
    const detailed = `${type}: modify logic in ${mainFile}\n\n- Added ${additions} lines\n- Removed ${deletions} lines`;

    return {
      steps,
      result: {
        stats: {
          additions,
          deletions,
          files_changed: filesArray.length
        },
        suggested_commits: [
          { type: "Conventional", message: summary },
          { type: "Detailed", message: detailed },
          { type: "Action-oriented", message: `Update ${mainFile} to improve logic` }
        ],
        files: filesArray
      },
    };
  },
};
