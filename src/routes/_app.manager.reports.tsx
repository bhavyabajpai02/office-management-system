import { createFileRoute } from "@tanstack/react-router";
import { WorkflowPage } from "@/components/WorkflowPage";

export const Route = createFileRoute("/_app/manager/reports")({
  component: () => <WorkflowPage kind="manager-reports" />,
});
