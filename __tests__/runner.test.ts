import { describe, it, expect } from "vitest";
import { runFlow, listFlows } from "../lib/engine/runner";

describe("ClawFlow Engine", () => {
  it("should list all registered flows", () => {
    const flows = listFlows();
    expect(flows.length).toBeGreaterThan(0);
    const flowIds = flows.map((f) => f.id);
    expect(flowIds).toContain("clean");
    expect(flowIds).toContain("task");
    expect(flowIds).toContain("brain");
  });

  it("should return an error for empty input", async () => {
    const result = await runFlow("clean", "   ");
    expect(result.success).toBe(false);
    expect((result.output as any).error).toBe("Input cannot be empty");
  });

  it("should return an error for unknown flow", async () => {
    const result = await runFlow("unknown_flow", "test input");
    expect(result.success).toBe(false);
    expect((result.output as any).error).toContain("not found");
  });

  it("should successfully run the clean flow", async () => {
    const result = await runFlow("clean", "  hello   world  ");
    expect(result.success).toBe(true);
    expect(result.steps.length).toBeGreaterThan(0);
    const output = result.output as any;
    expect(output.cleaned_text).toBe("hello world");
    expect(output.stats.words).toBe(2);
  });

  it("should properly execute the pipeline flow", async () => {
    const result = await runFlow("pipeline", "build an app for students");
    expect(result.success).toBe(true);
    expect(result.flow).toBe("pipeline");
    const output = result.output as any;
    expect(output.stages).toBeDefined();
    expect(output.stages.stage_1_clean).toBeDefined();
    expect(output.stages.stage_2_tasks).toBeDefined();
    expect(output.stages.stage_3_plan).toBeDefined();
  });

  it("should include pipelineInput in flow results", async () => {
    const result = await runFlow("clean", "  test input  ");
    expect(result.success).toBe(true);
    const output = result.output as any;
    expect(output.pipelineInput).toBeDefined();
    expect(output.pipelineInput).toBe("test input");
  });
});
