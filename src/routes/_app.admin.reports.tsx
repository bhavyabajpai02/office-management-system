import { createFileRoute } from "@tanstack/react-router";
import { WorkflowPage } from "@/components/WorkflowPage";

export const Route = createFileRoute("/_app/admin/reports")({
  component: () => <WorkflowPage kind="admin-reports" />,
});
