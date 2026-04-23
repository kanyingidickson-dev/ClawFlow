/**
 * Core types for the ClawFlow execution engine
 */

export interface FlowResult {
  steps: string[];
  result: unknown;
  /** Optional string to pass as input to next pipeline step */
  pipelineInput?: string;
}

export interface FlowDefinition {
  id: string;
  name: string;
  description: string;
  example: string;
  icon: string;
  color: string;
  category: FlowCategory;
  execute: (input: string) => Promise<FlowResult> | FlowResult;
}

/** Flow categories for UI grouping */
export type FlowCategory = 
  | "text"      // Text Processing
  | "planning"  // Planning & Thinking  
  | "dev"       // Developer Tools
  | "productivity"; // Productivity

/**
 * Standardized execution response from the runner
 */
export interface ExecutionResult {
  flow: string;
  success: boolean;
  steps: string[];
  output: unknown;
  executedAt: string;
  duration: number;
}

/**
 * Flow metadata for API consumers
 */
export interface FlowMetadata {
  id: string;
  name: string;
  description: string;
  example: string;
  icon: string;
  color: string;
  category: FlowCategory;
}
