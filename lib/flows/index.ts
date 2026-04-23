import { FlowDefinition } from "../engine/types";
import { taskClaw } from "./taskClaw";
import { debugClaw } from "./debugClaw";
import { brainClaw } from "./brainClaw";
import { cleanClaw } from "./cleanClaw";
import { summaryClaw } from "./summaryClaw";
import { pipelineClaw } from "./pipelineClaw";
import { calendarClaw } from "./calendarClaw";
import { gitClaw } from "./gitClaw";
import { csvClaw } from "./csvClaw";
import { emailClaw } from "./emailClaw";
import { noteClaw } from "./noteClaw";
import { jsonClaw } from "./jsonClaw";
import { diffClaw } from "./diffClaw";
import { sentimentClaw } from "./sentimentClaw";

/**
 * Flow Registry
 *
 * Central registry for all executable flows.
 * Each flow implements the FlowDefinition interface and returns:
 *   { steps: string[], result: any }
 *
 * To add a new flow:
 *   1. Create your flow file: lib/flows/myFlow.ts
 *   2. Import it: import { myFlow } from "./myFlow";
 *   3. Add to registry below
 */

export const flows: Record<string, FlowDefinition> = {
  task: taskClaw,
  debug: debugClaw,
  brain: brainClaw,
  clean: cleanClaw,
  summary: summaryClaw,
  pipeline: pipelineClaw,
  calendar: calendarClaw,
  git: gitClaw,
  csv: csvClaw,
  email: emailClaw,
  note: noteClaw,
  json: jsonClaw,
  diff: diffClaw,
  sentiment: sentimentClaw,
};

export type FlowId = keyof typeof flows;
