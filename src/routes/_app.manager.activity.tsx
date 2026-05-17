import { createFileRoute } from "@tanstack/react-router";
import { WorkflowPage } from "@/components/WorkflowPage";

export const Route = createFileRoute("/_app/manager/activity")({
  component: () => <WorkflowPage kind="manager-activity" />,
});
