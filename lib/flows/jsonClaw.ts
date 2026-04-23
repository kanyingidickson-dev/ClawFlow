import { FlowDefinition, FlowResult } from "../engine/types";

export const jsonClaw: FlowDefinition = {
  id: "json",
  name: "JSON-Claw",
  description: "Validates, formats, and analyzes JSON strings",
  example: '{"name": "test", "active": true, "items": [1,2,3]}',
  icon: "{}",
  color: "#eab308",
  category: "dev",

  execute(input: string): FlowResult {
    const steps: string[] = ["Parsing JSON string"];
    
    try {
      const parsed = JSON.parse(input);
      steps.push("JSON parsed successfully");
      
      const isArray = Array.isArray(parsed);
      const keyCount = isArray ? parsed.length : (typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0);
      
      steps.push("Formatting output");
      
      return {
        steps,
        result: {
          valid: true,
          type: isArray ? 'array' : typeof parsed,
          root_keys: keyCount,
          formatted: JSON.stringify(parsed, null, 2)
        },
      };
    } catch (e: unknown) {
      steps.push("JSON parsing failed");
      return {
        steps,
        result: {
          valid: false,
          error: e instanceof Error ? e.message : "Invalid JSON",
        },
      };
    }
  },
};
