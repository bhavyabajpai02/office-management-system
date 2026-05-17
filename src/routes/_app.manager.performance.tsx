import { createFileRoute } from "@tanstack/react-router";
import { WorkflowPage } from "@/components/WorkflowPage";

export const Route = createFileRoute("/_app/manager/performance")({
  component: () => <WorkflowPage kind="manager-performance" />,
});
