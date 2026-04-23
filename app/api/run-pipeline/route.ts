import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/engine/runner";
import { z } from "zod";
import { db, executions } from "@/lib/db";
import { randomUUID } from "crypto";

const RunPipelineSchema = z.object({
  input: z.string().min(1, "Input is required").max(10000, "Input too long"),
  flows: z.array(z.string()).min(1, "At least one flow is required"),
});

/**
 * POST /api/run-pipeline
 *
 * Executes a sequence of flows
 * Body: { input: string, flows: string[] }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RunPipelineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { input, flows } = parsed.data;
    const result = await runPipeline(flows, input);

    // Save to Database
    try {
      db.insert(executions).values({
        id: randomUUID(),
        flowId: "custom-pipeline",
        input: input,
        output: result.output,
        steps: result.steps,
        duration: result.duration,
        createdAt: new Date(result.executedAt),
        success: result.success,
      }).run();
    } catch (dbError) {
      console.error("Failed to persist pipeline execution to DB:", dbError);
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to process pipeline request" },
      { status: 500 }
    );
  }
}
