import { createFileRoute } from "@tanstack/react-router";
import { WorkflowPage } from "@/components/WorkflowPage";

export const Route = createFileRoute("/_app/admin/compliance")({
  component: () => <WorkflowPage kind="admin-compliance" />,
});
