import { NextResponse } from "next/server";
import { runFlow } from "@/lib/engine/runner";
import { z } from "zod";
import { db, executions } from "@/lib/db";
import { randomUUID } from "crypto";

const RunFlowSchema = z.object({
  input: z.string().min(1, "Input is required").max(10000, "Input too long"),
  flow: z.string().min(1, "Flow ID is required").optional(),
  flowId: z.string().min(1, "Flow ID is required").optional(),
}).refine((data) => data.flow || data.flowId, {
  message: "Either flow or flowId is required",
});

/**
 * POST /api/run-flow
 *
 * Executes a flow with the given input
 * Body: { input: string, flow: string }
 * Returns: ExecutionResult
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RunFlowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { input, flow, flowId } = parsed.data;
    const flowIdentifier = flow || flowId!;
    const result = await runFlow(flowIdentifier, input);

    // Save to Database
    try {
      db.insert(executions).values({
        id: randomUUID(),
        flowId: flowIdentifier,
        input: input,
        output: result.output,
        steps: result.steps,
        duration: result.duration,
        createdAt: new Date(result.executedAt),
        success: result.success,
      }).run();
    } catch (dbError) {
      console.error("Failed to persist execution to DB:", dbError);
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
