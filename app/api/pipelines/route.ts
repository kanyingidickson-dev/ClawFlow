import { NextResponse } from "next/server";
import { db, pipelines } from "@/lib/db";
import { randomUUID } from "crypto";
import { z } from "zod";

const SavePipelineSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  flowIds: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = SavePipelineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const id = randomUUID();
    db.insert(pipelines).values({
      id,
      name: parsed.data.name,
      flowIds: parsed.data.flowIds,
      createdAt: new Date(),
    }).run();

    return NextResponse.json({ id, success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save pipeline" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const allPipelines = db.select().from(pipelines).all();
    return NextResponse.json(allPipelines);
  } catch {
    return NextResponse.json({ error: "Failed to fetch pipelines" }, { status: 500 });
  }
}
