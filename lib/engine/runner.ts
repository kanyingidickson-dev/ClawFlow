import { flows } from "../flows";
import { ExecutionResult, FlowMetadata } from "./types";
import { getCustomClaws, createCustomFlowDefinition } from "../flows/customClawTemplates";

/**
 * Executes a flow by name with the given input
 * Returns standardized execution result with timing
 */
export async function runFlow(flowName: string, input: string): Promise<ExecutionResult> {
  const startTime = performance.now();
  let flow = flows[flowName];

  // Check custom claws if not found in built-in flows
  if (!flow && typeof window !== "undefined") {
    const customClaws = getCustomClaws();
    const customConfig = customClaws.find(c => c.id === flowName);
    if (customConfig) {
      flow = createCustomFlowDefinition(customConfig);
    }
  }

  if (!flow) {
    return {
      flow: flowName,
      success: false,
      steps: ["Validating flow", "Flow lookup failed"],
      output: { error: `Flow "${flowName}" not found` },
      executedAt: new Date().toISOString(),
      duration: Math.round(performance.now() - startTime),
    };
  }

  if (!input || typeof input !== "string" || input.trim().length === 0) {
    return {
      flow: flowName,
      success: false,
      steps: ["Validating input", "Input validation failed"],
      output: { error: "Input cannot be empty" },
      executedAt: new Date().toISOString(),
      duration: Math.round(performance.now() - startTime),
    };
  }

  if (input.length > 10000) {
    return {
      flow: flowName,
      success: false,
      steps: ["Validating input", "Input too long"],
      output: { error: "Input exceeds maximum length of 10,000 characters" },
      executedAt: new Date().toISOString(),
      duration: Math.round(performance.now() - startTime),
    };
  }

  try {
    const execution = await flow.execute(input);

    return {
      flow: flowName,
      success: true,
      steps: execution.steps,
      output: execution.result,
      executedAt: new Date().toISOString(),
      duration: Math.round(performance.now() - startTime),
    };
  } catch (err: unknown) {
    return {
      flow: flowName,
      success: false,
      steps: ["Executing flow", "Execution failed"],
      output: { error: err instanceof Error ? err.message : "Unknown error during execution" },
      executedAt: new Date().toISOString(),
      duration: Math.round(performance.now() - startTime),
    };
  }
}

/**
 * Lists all available flows with metadata (including custom claws)
 */
export function listFlows(): FlowMetadata[] {
  const builtIn = Object.values(flows).map((flow) => ({
    id: flow.id,
    name: flow.name,
    description: flow.description,
    example: flow.example,
    icon: flow.icon,
    color: flow.color,
    category: flow.category,
  }));

  // Add custom claws from localStorage (client-side only)
  let custom: FlowMetadata[] = [];
  if (typeof window !== "undefined") {
    const customConfigs = getCustomClaws();
    custom = customConfigs.map(config => {
      const def = createCustomFlowDefinition(config);
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        example: def.example,
        icon: def.icon,
        color: def.color,
        category: def.category,
      };
    });
  }

  return [...builtIn, ...custom];
}

/**
 * Get custom claws metadata (for client-side use)
 */
export function listCustomFlows(): FlowMetadata[] {
  if (typeof window === "undefined") return [];
  const customConfigs = getCustomClaws();
  return customConfigs.map(config => {
    const def = createCustomFlowDefinition(config);
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      example: def.example,
      icon: def.icon,
      color: def.color,
      category: def.category,
    };
  });
}
/**
 * Executes a sequence of flows (pipeline)
 */
export async function runPipeline(flowIds: string[], input: string): Promise<ExecutionResult> {
  const startTime = performance.now();
  const steps: string[] = [`Initializing pipeline with ${flowIds.length} steps`];
  const pipelineOutput: Record<string, unknown> = {};
  let currentInput = input;
  let success = true;

  for (let i = 0; i < flowIds.length; i++) {
    const flowId = flowIds[i];
    steps.push(`Step ${i + 1}: Running ${flowId}`);
    
    const result = await runFlow(flowId, currentInput);
    
    if (!result.success) {
      const errorOutput = result.output as { error?: string };
      steps.push(`Step ${i + 1} failed: ${errorOutput?.error ?? 'Unknown error'}`);
      pipelineOutput[`step_${i + 1}_${flowId}_error`] = result.output;
      success = false;
      break;
    }
    
    steps.push(...result.steps.map(s => `  ↳ ${s}`));
    pipelineOutput[`step_${i + 1}_${flowId}`] = result.output;
    
    // Pass output to next step using pipelineInput if provided
    if (result.output && typeof result.output === 'object') {
      const execution = result.output as { pipelineInput?: string };
      if (execution.pipelineInput && typeof execution.pipelineInput === 'string') {
        currentInput = execution.pipelineInput;
      }
    }
  }

  return {
    flow: "custom-pipeline",
    success,
    steps,
    output: {
      stages: pipelineOutput,
      final_input: currentInput !== input ? currentInput : undefined
    },
    executedAt: new Date().toISOString(),
    duration: Math.round(performance.now() - startTime),
  };
}
