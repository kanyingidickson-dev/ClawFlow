import { listFlows } from "@/lib/engine/runner";
import { ClientHome } from "@/components/ClientHome";

export default function Page() {
  const flows = listFlows();
  return <ClientHome initialFlows={flows} />;
}
