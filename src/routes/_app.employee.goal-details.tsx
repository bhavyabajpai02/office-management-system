import { createFileRoute } from "@tanstack/react-router";
import { WorkflowPage } from "@/components/WorkflowPage";

export const Route = createFileRoute("/_app/employee/goal-details")({
  component: () => <WorkflowPage kind="employee-goal-details" />,
});
