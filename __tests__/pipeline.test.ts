import { describe, it, expect } from "vitest";
import { runPipeline } from "../lib/engine/runner";

describe("Pipeline Execution Engine", () => {
  it("should execute multiple flows in sequence", async () => {
    const res = await runPipeline(["clean", "task"], "  fix bug, deploy  ");
    
    expect(res.success).toBe(true);
    expect(res.flow).toBe("custom-pipeline");
    expect(res.steps.length).toBeGreaterThan(5);
    
    const output = res.output as any;
    expect(output.stages.step_1_clean).toBeDefined();
    expect(output.stages.step_2_task).toBeDefined();
    
    // Check if cleaning worked
    expect(output.stages.step_1_clean.cleaned_text).toBe("fix bug, deploy");
    
    // Check if task extraction worked
    expect(output.stages.step_2_task.tasks.length).toBe(2);
  });

  it("should fail gracefully if a step fails", async () => {
    const res = await runPipeline(["nonexistent", "task"], "some input");
    expect(res.success).toBe(false);
    expect(res.steps).toContain("Step 1 failed: Flow \"nonexistent\" not found");
  });

  it("should pass output as input to the next step", async () => {
    // Stage 1: clean (outputs pipelineInput: cleaned_text)
    // Stage 2: task (receives cleaned_text, outputs pipelineInput: formatted tasks)
    const input = "   hello   . task: test   ";
    const res = await runPipeline(["clean", "task"], input);
    
    expect(res.success).toBe(true);
    // final_input should now be the task flow's pipelineInput (formatted tasks)
    expect(res.output.final_input).toContain("hello");
    expect(res.output.final_input).toContain("task: test");
  });
});
