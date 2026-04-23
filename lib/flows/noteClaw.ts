import { FlowDefinition, FlowResult } from "../engine/types";

export const noteClaw: FlowDefinition = {
  id: "note",
  name: "Note-Claw",
  description: "Converts messy text into structured Obsidian/Markdown format",
  example: "React is a UI library. Nextjs is a framework for React. It uses server components.",
  icon: "📓",
  color: "#a855f7",
  category: "text",

  execute(input: string): FlowResult {
    const steps: string[] = ["Extracting keywords for tags"];
    
    const words = input.toLowerCase().split(/[\s.,]+/);
    const stopWords = new Set(["is", "a", "for", "it", "uses", "the", "and", "in", "to"]);
    const tags = Array.from(new Set(words.filter(w => w.length > 3 && !stopWords.has(w)))).slice(0, 5);
    
    steps.push("Structuring content blocks");
    
    const sentences = input.split(/(?<=\.)\s+/).filter(s => s.trim().length > 0);
    
    steps.push("Formatting as Markdown");
    
    let markdown = `---\ntags: [${tags.map(t => `"${t}"`).join(', ')}]\ndate: ${new Date().toISOString().split('T')[0]}\n---\n\n`;
    markdown += `# Summary\n\n`;
    
    sentences.forEach((sentence) => {
      markdown += `- ${sentence.trim()}\n`;
    });

    return {
      steps,
      result: {
        tags: tags,
        markdown: markdown,
        pipelineInput: markdown,
      },
    };
  },
};
