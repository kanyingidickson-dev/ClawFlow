import { describe, it, expect } from "vitest";
import { runFlow } from "../lib/engine/runner";

describe("Edge Case Tests", () => {
  it("JSON-Claw should handle empty input", async () => {
    const res = await runFlow("json", " ");
    expect(res.success).toBe(false);
    expect(res.output.error).toBeDefined();
  });

  it("JSON-Claw should handle malformed JSON", async () => {
    const res = await runFlow("json", "{ invalid }");
    expect(res.success).toBe(true); // Engine runs, but output says invalid
    expect((res.output as any).valid).toBe(false);
  });

  it("CSV-Claw should handle unclosed quotes", async () => {
    const res = await runFlow("csv", 'id,name\n1,"John');
    expect(res.success).toBe(true);
    expect((res.output as any).data[0].name).toBe("John"); // Should fallback gracefully
  });

  it("Runner should reject 10,000+ characters", async () => {
    const longInput = "a".repeat(10001);
    const res = await runFlow("clean", longInput);
    expect(res.success).toBe(false);
    expect(res.output.error).toContain("exceeds maximum length");
  });

  it("Email-Claw should handle multiple to: lines gracefully", async () => {
    const input = "to: test1@example.com\nto: test2@example.com\nhello";
    const res = await runFlow("email", input);
    expect(res.success).toBe(true);
    const draft = (res.output as any).draft;
    expect(draft).toContain("To: test1@example.com"); // Takes first match
  });

  it("Calendar-Claw should handle lowercase names now", async () => {
    const res = await runFlow("calendar", "Meeting with alice tomorrow");
    expect(res.success).toBe(true);
    expect((res.output as any).event.participants).toContain("alice");
  });
});
