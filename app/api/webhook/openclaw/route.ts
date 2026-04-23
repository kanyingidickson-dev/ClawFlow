/**
 * OpenClaw Webhook Integration Endpoint
 * 
 * This is the primary integration point between OpenClaw agents and ClawFlow.
 * OpenClaw agents send tasks here; ClawFlow executes them deterministically
 * and returns structured data for the agent's next decision.
 * 
 * Integration Flow:
 * 1. OpenClaw agent recognizes intent (e.g., "parse these tasks")
 * 2. Agent POSTs to this endpoint: { trigger_id, flow: "task", input: "..." }
 * 3. ClawFlow executes the flow in < 5ms
 * 4. Response returned: { status, execution_data: { output, steps, duration } }
 * 5. Agent uses structured data to complete the user request
 * 
 * Authentication: Optional via x-api-key header (set OPENCLAW_API_KEY env var)
 * 
 * Example OpenClaw config: see /openclaw.config.yml
 */

import { NextResponse } from "next/server";
import { runFlow } from "@/lib/engine/runner";

// Using default Node.js runtime for SQLite compatibility

/**
 * POST /api/webhook/openclaw
 * 
 * OpenClaw-compatible webhook endpoint for deterministic skill execution.
 * This is how OpenClaw agents delegate parsing, validation, and transformation
 * tasks to ClawFlow's deterministic execution engine.
 */
export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (process.env.OPENCLAW_API_KEY && apiKey !== process.env.OPENCLAW_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Expected Payload from OpenClaw:
    // { "trigger_id": "oc-999", "flow": "task", "input": "Build a database" }
    
    const { flow, input, trigger_id } = body;
    
    if (!flow || typeof input !== 'string') {
      return NextResponse.json(
        { error: "Invalid payload: missing 'flow' or 'input' string" },
        { status: 400 }
      );
    }
    
    // Process the flow synchronously/asynchronously via the ClawFlow Engine
    const result = await runFlow(flow, input);
    
    // Save to Database for history tracking
    try {
      const { db, executions } = await import("@/lib/db");
      const { randomUUID } = await import("crypto");
      
      db.insert(executions).values({
        id: randomUUID(),
        flowId: flow,
        input: input,
        output: result.output,
        steps: result.steps,
        duration: result.duration,
        createdAt: new Date(result.executedAt),
        success: result.success,
      }).run();
    } catch (dbError) {
      console.error("Failed to persist webhook execution to DB:", dbError);
    }
    
    // Return structured result back to OpenClaw
    return NextResponse.json({
      bridge_version: "1.0",
      trigger_id: trigger_id || "manual-trigger",
      status: result.success ? "completed" : "failed",
      execution_data: result
    });
    
  } catch {
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
