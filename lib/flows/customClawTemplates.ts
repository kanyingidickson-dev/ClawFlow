import { FlowDefinition, FlowResult } from "../engine/types";

export type TemplateType = 
  | "uppercase"
  | "lowercase"
  | "reverse"
  | "extract-tasks"
  | "extract-links"
  | "extract-emails"
  | "format-json"
  | "format-markdown"
  | "count-words"
  | "remove-duplicates"
  | "custom";

export interface CustomClawConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: "text" | "planning" | "dev" | "productivity";
  template: TemplateType;
  customLogic?: string;
  createdAt: number;
}

const TEMPLATE_DEFINITIONS: Record<TemplateType, Omit<FlowDefinition, "id" | "name" | "description" | "icon" | "color" | "category"> & { defaultIcon: string; defaultColor: string }> = {
  uppercase: {
    defaultIcon: "🔠",
    defaultColor: "#f59e0b",
    example: "hello world",
    execute(input: string): FlowResult {
      return {
        steps: ["Converting to uppercase", "Transforming all characters"],
        result: { transformed: input.toUpperCase(), originalLength: input.length, newLength: input.toUpperCase().length },
      };
    },
  },
  lowercase: {
    defaultIcon: "🔡",
    defaultColor: "#10b981",
    example: "HELLO WORLD",
    execute(input: string): FlowResult {
      return {
        steps: ["Converting to lowercase", "Normalizing text case"],
        result: { transformed: input.toLowerCase(), originalLength: input.length, newLength: input.toLowerCase().length },
      };
    },
  },
  reverse: {
    defaultIcon: "🔄",
    defaultColor: "#ec4899",
    example: "hello world",
    execute(input: string): FlowResult {
      const reversed = input.split("").reverse().join("");
      return {
        steps: ["Reversing character order", "Rebuilding string"],
        result: { reversed, original: input, charCount: input.length },
      };
    },
  },
  "extract-tasks": {
    defaultIcon: "✅",
    defaultColor: "#3b82f6",
    example: "I need to finish the report, call the client, and schedule a meeting tomorrow",
    execute(input: string): FlowResult {
      const taskKeywords = ["need to", "should", "must", "todo", "fix", "implement", "call", "schedule", "finish", "complete", "review", "send", "update"];
      const sentences = input.split(/[.!?\n]+/).filter(s => s.trim());
      const tasks: string[] = [];
      
      sentences.forEach(sentence => {
        const lower = sentence.toLowerCase();
        if (taskKeywords.some(kw => lower.includes(kw))) {
          tasks.push(sentence.trim());
        }
      });

      const lines = input.split("\n");
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith("-") || trimmed.startsWith("*") || /^\d+[.)]/.test(trimmed)) {
          tasks.push(trimmed.replace(/^[-*\d.)\s]+/, "").trim());
        }
      });

      const uniqueTasks = [...new Set(tasks.filter(t => t.length > 3))];
      
      return {
        steps: ["Scanning for task keywords", "Parsing list items", "Extracting unique tasks"],
        result: { 
          tasks: uniqueTasks, 
          count: uniqueTasks.length,
          sourceLength: input.length 
        },
      };
    },
  },
  "extract-links": {
    defaultIcon: "🔗",
    defaultColor: "#06b6d4",
    example: "Check out https://example.com and http://test.org for more info",
    execute(input: string): FlowResult {
      const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
      const links = input.match(urlRegex) || [];
      
      return {
        steps: ["Scanning for URL patterns", "Validating link formats", "Extracting unique links"],
        result: { 
          links: [...new Set(links)], 
          count: [...new Set(links)].length,
          domains: [...new Set(links.map(l => new URL(l).hostname))].filter(Boolean)
        },
      };
    },
  },
  "extract-emails": {
    defaultIcon: "📧",
    defaultColor: "#8b5cf6",
    example: "Contact us at support@example.com or sales@company.org",
    execute(input: string): FlowResult {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = input.match(emailRegex) || [];
      
      return {
        steps: ["Scanning for email patterns", "Validating email formats", "Extracting unique addresses"],
        result: { 
          emails: [...new Set(emails)], 
          count: [...new Set(emails)].length,
          domains: [...new Set(emails.map(e => e.split("@")[1]))]
        },
      };
    },
  },
  "format-json": {
    defaultIcon: "🗂️",
    defaultColor: "#22c55e",
    example: '{"name":"John","age":30,"city":"NYC"}',
    execute(input: string): FlowResult {
      try {
        const parsed = JSON.parse(input);
        const formatted = JSON.stringify(parsed, null, 2);
        return {
          steps: ["Parsing JSON structure", "Validating syntax", "Pretty-printing with indentation"],
          result: { 
            formatted, 
            valid: true,
            type: Array.isArray(parsed) ? "array" : typeof parsed,
            keys: typeof parsed === "object" && !Array.isArray(parsed) ? Object.keys(parsed) : null
          },
        };
      } catch (e) {
        return {
          steps: ["Parsing JSON structure", "⚠️ Invalid JSON detected"],
          result: { 
            error: "Invalid JSON",
            hint: "Check for trailing commas or missing quotes",
            valid: false
          },
        };
      }
    },
  },
  "format-markdown": {
    defaultIcon: "📝",
    defaultColor: "#f97316",
    example: "# Heading\nSome text\n\nMore text",
    execute(input: string): FlowResult {
      const lines = input.split("\n");
      const headings = lines.filter(l => l.startsWith("#")).length;
      const lists = lines.filter(l => l.trim().startsWith("-") || l.trim().startsWith("*")).length;
      const codeBlocks = (input.match(/```/g) || []).length / 2;
      
      return {
        steps: ["Analyzing markdown structure", "Counting elements", "Generating metadata"],
        result: { 
          structure: {
            headings,
            listItems: lists,
            codeBlocks: Math.floor(codeBlocks),
            paragraphs: lines.filter(l => l.trim() && !l.startsWith("#") && !l.startsWith("-") && !l.startsWith("*")).length
          },
          preview: input.slice(0, 200) + (input.length > 200 ? "..." : ""),
          wordCount: input.split(/\s+/).filter(w => w).length
        },
      };
    },
  },
  "count-words": {
    defaultIcon: "🔢",
    defaultColor: "#6366f1",
    example: "The quick brown fox jumps over the lazy dog",
    execute(input: string): FlowResult {
      const words = input.trim().split(/\s+/).filter(w => w);
      const chars = input.length;
      const charsNoSpaces = input.replace(/\s/g, "").length;
      const sentences = input.split(/[.!?]+/).filter(s => s.trim());
      
      return {
        steps: ["Counting words", "Counting characters", "Analyzing sentence structure"],
        result: { 
          words: words.length,
          characters: chars,
          charactersNoSpaces: charsNoSpaces,
          sentences: sentences.length,
          averageWordLength: charsNoSpaces / words.length || 0,
          mostCommonWords: [...new Set(words)]
            .map(w => ({ word: w, count: words.filter(x => x.toLowerCase() === w.toLowerCase()).length }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        },
      };
    },
  },
  "remove-duplicates": {
    defaultIcon: "🧹",
    defaultColor: "#14b8a6",
    example: "apple\napple\nbanana\napple\nbanana\ncherry",
    execute(input: string): FlowResult {
      const lines = input.split("\n");
      const uniqueLines = [...new Set(lines.map(l => l.trim()).filter(Boolean))];
      const duplicatesRemoved = lines.length - uniqueLines.length;
      
      return {
        steps: ["Splitting into lines", "Identifying duplicates", "Removing duplicates", "Rebuilding output"],
        result: { 
          uniqueLines,
          uniqueCount: uniqueLines.length,
          originalCount: lines.length,
          duplicatesRemoved,
          output: uniqueLines.join("\n")
        },
      };
    },
  },
  custom: {
    defaultIcon: "⚡",
    defaultColor: "#a855f7",
    example: "Enter your input here",
    execute(input: string): FlowResult {
      return {
        steps: ["Processing with custom logic", "Applying transformations"],
        result: { output: input, processed: true, timestamp: Date.now() },
      };
    },
  },
};

export function createCustomFlowDefinition(config: CustomClawConfig): FlowDefinition {
  const template = TEMPLATE_DEFINITIONS[config.template];
  
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    example: template.example,
    icon: config.icon || template.defaultIcon,
    color: config.color || template.defaultColor,
    category: config.category,
    execute: template.execute,
  };
}

export function getTemplateOptions(): { value: TemplateType; label: string; icon: string; description: string }[] {
  return [
    { value: "uppercase", label: "Uppercase Transformer", icon: "🔠", description: "Convert text to ALL CAPS" },
    { value: "lowercase", label: "Lowercase Transformer", icon: "🔡", description: "Convert text to lowercase" },
    { value: "reverse", label: "Text Reverser", icon: "🔄", description: "Reverse character order" },
    { value: "extract-tasks", label: "Task Extractor", icon: "✅", description: "Extract action items from text" },
    { value: "extract-links", label: "Link Extractor", icon: "🔗", description: "Pull out URLs from text" },
    { value: "extract-emails", label: "Email Extractor", icon: "📧", description: "Find email addresses" },
    { value: "format-json", label: "JSON Formatter", icon: "🗂️", description: "Pretty-print JSON data" },
    { value: "format-markdown", label: "Markdown Analyzer", icon: "📝", description: "Analyze markdown structure" },
    { value: "count-words", label: "Word Counter", icon: "🔢", description: "Count words and characters" },
    { value: "remove-duplicates", label: "Duplicate Remover", icon: "🧹", description: "Remove duplicate lines" },
    { value: "custom", label: "Custom Logic", icon: "⚡", description: "Build your own (template)" },
  ];
}

export function getCategoryOptions(): { value: CustomClawConfig["category"]; label: string; icon: string }[] {
  return [
    { value: "text", label: "Text Processing", icon: "✍️" },
    { value: "planning", label: "Planning & Thinking", icon: "🧠" },
    { value: "dev", label: "Developer Tools", icon: "🛠️" },
    { value: "productivity", label: "Productivity", icon: "📅" },
  ];
}

const STORAGE_KEY = "clawflow_custom_claws";

export function saveCustomClaw(config: CustomClawConfig): void {
  if (typeof window === "undefined") return;
  const existing = getCustomClaws();
  const filtered = existing.filter(c => c.id !== config.id);
  filtered.push(config);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function getCustomClaws(): CustomClawConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function deleteCustomClaw(id: string): void {
  if (typeof window === "undefined") return;
  const existing = getCustomClaws();
  const filtered = existing.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function generateCustomClawId(): string {
  return `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
