import { describe, it, expect } from "vitest";
import { runFlow } from "../lib/engine/runner";

describe("New Flows Execution Tests", () => {
  it("Calendar-Claw should extract event details", async () => {
    const res = await runFlow("calendar", "Meeting with Alice tomorrow at 10am to discuss marketing");
    expect(res.success).toBe(true);
    const event = (res.output as any).event;
    expect(event.participants).toContain("Alice");
    expect(event.time).toBe("10am");
    expect(event.date).toBe("Tomorrow");
  });

  it("Git-Claw should parse diffs", async () => {
    const diff = `diff --git a/test.js b/test.js\n+ const a = 1;\n- const a = 0;`;
    const res = await runFlow("git", diff);
    expect(res.success).toBe(true);
    const stats = (res.output as any).stats;
    expect(stats.additions).toBe(1);
    expect(stats.deletions).toBe(1);
    expect((res.output as any).files).toContain("test.js");
  });

  it("CSV-Claw should parse CSV", async () => {
    const csv = `name, age\nAlice, 30\nBob, 25`;
    const res = await runFlow("csv", csv);
    expect(res.success).toBe(true);
    const data = (res.output as any).data;
    expect(data.length).toBe(2);
    expect(data[0].name).toBe("Alice");
    expect(data[0].age).toBe(30);
  });

  it("Email-Claw should generate draft", async () => {
    const res = await runFlow("email", "Hello world. Testing email.");
    expect(res.success).toBe(true);
    const draft = (res.output as any).draft;
    expect(draft).toContain("Hello world");
    expect(draft).toContain("Testing email");
  });

  it("Note-Claw should extract tags", async () => {
    const res = await runFlow("note", "React is a UI library.");
    expect(res.success).toBe(true);
    const tags = (res.output as any).tags;
    expect(tags).toContain("react");
    expect(tags).toContain("library");
  });

  it("JSON-Claw should parse and validate JSON", async () => {
    const res = await runFlow("json", '{"name": "test", "items": [1,2]}');
    expect(res.success).toBe(true);
    expect((res.output as any).valid).toBe(true);
    expect((res.output as any).root_keys).toBe(2);
    expect((res.output as any).type).toBe("object");
  });

  it("Diff-Claw should find added/removed words", async () => {
    const res = await runFlow("diff", "apple orange\n---DIFF---\napple banana");
    expect(res.success).toBe(true);
    const output = res.output as any;
    expect(output.added).toContain("banana");
    expect(output.removed).toContain("orange");
    expect(output.unchanged_count).toBe(1); // apple
  });

  it("Sentiment-Claw should calculate sentiment", async () => {
    const res = await runFlow("sentiment", "This is great and awesome but terrible");
    expect(res.success).toBe(true);
    const output = res.output as any;
    expect(output.metrics.positive_keywords).toBe(2); // great, awesome
    expect(output.metrics.negative_keywords).toBe(1); // terrible
    expect(output.score).toBeGreaterThan(0);
  });
});
