import { NextResponse } from "next/server";
import { db, executions, desc } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const history = db.select().from(executions).orderBy(desc(executions.createdAt)).limit(50).all();
    
    return NextResponse.json(history);
  } catch {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { flowId, input, output, steps, duration, success } = body;

    db.insert(executions).values({
      id: randomUUID(),
      flowId: flowId || "unknown",
      input: input || "",
      output: output || null,
      steps: steps || [],
      duration: duration || 0,
      createdAt: new Date(),
      success: success ?? true,
    }).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save history:", error);
    return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
  }
}
