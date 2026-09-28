import { EvaluationWorkspace } from "@/components/evaluation/EvaluationWorkspace";

export default async function EvaluationWorkspacePage(
  props: PageProps<"/evaluator/scripts/[allocationId]">,
) {
  const { allocationId } = await props.params;
  return <EvaluationWorkspace allocationId={allocationId} />;
}
