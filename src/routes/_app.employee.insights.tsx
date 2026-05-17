import { createFileRoute } from "@tanstack/react-router";
import { WorkflowPage } from "@/components/WorkflowPage";

export const Route = createFileRoute("/_app/employee/insights")({
  component: () => <WorkflowPage kind="employee-insights" />,
});
