import { FlowDefinition, FlowResult } from "../engine/types";
import { cleanClaw } from "./cleanClaw";
import { taskClaw } from "./taskClaw";
import { brainClaw } from "./brainClaw";

/**
 * Pipeline-Claw: Chains multiple flows together (meta-flow)
 * Demonstrates real orchestration by running Clean → Task → Brain
 * sequentially and collecting intermediate results
 */

export const pipelineClaw: FlowDefinition = {
  id: "pipeline",
  name: "Pipeline-Claw",
  category: "planning",
  description: "Chains Clean → Task → Brain flows together, demonstrating real workflow orchestration",
  example: "  build a marketplace for students,  setup payments,  deploy to production  ",
  icon: "⚡",
  color: "#3b82f6",

  async execute(input: string): Promise<FlowResult> {
    const steps: string[] = [
      "Initializing pipeline orchestrator",
    ];

    const pipeline: Record<string, unknown> = {};

    // Stage 1: Clean
    steps.push("Stage 1: Running Clean-Claw");
    const cleanResult = await cleanClaw.execute(input);
    steps.push(...cleanResult.steps.map((s) => `  ↳ ${s}`));
    steps.push("Stage 1: Clean-Claw completed ✓");
    pipeline.stage_1_clean = cleanResult.result;

    // Extract cleaned text for next stage
    const cleanedOutput = cleanResult.result as { cleaned_text: string };
    const cleanedInput = cleanedOutput.cleaned_text || input;

    // Stage 2: Task
    steps.push("Stage 2: Running Task-Claw");
    const taskResult = await taskClaw.execute(cleanedInput);
    steps.push(...taskResult.steps.map((s) => `  ↳ ${s}`));
    steps.push("Stage 2: Task-Claw completed ✓");
    pipeline.stage_2_tasks = taskResult.result;

    // Stage 3: Brain
    steps.push("Stage 3: Running Brain-Claw");
    const brainResult = await brainClaw.execute(cleanedInput);
    steps.push(...brainResult.steps.map((s) => `  ↳ ${s}`));
    steps.push("Stage 3: Brain-Claw completed ✓");
    pipeline.stage_3_plan = brainResult.result;

    steps.push("Pipeline execution completed — 3 stages processed");

    return {
      steps,
      result: {
        stages: pipeline,
        pipelineInput: cleanedInput,
      },
    };
  },
};
