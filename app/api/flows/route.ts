import { NextResponse } from "next/server";
import { listFlows } from "@/lib/engine/runner";

/**
 * GET /api/flows
 *
 * Returns list of all available flows with metadata
 * Returns: FlowMetadata[]
 */
export async function GET() {
  const flows = listFlows();
  return NextResponse.json(flows);
}
