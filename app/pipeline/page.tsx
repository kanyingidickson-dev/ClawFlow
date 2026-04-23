import { listFlows } from "@/lib/engine/runner";
import { PipelineBuilder } from "@/components/PipelineBuilder";

export default function PipelinePage() {
  const flows = listFlows();
  return <PipelineBuilder availableFlows={flows} />;
}
