import { createFileRoute } from "@tanstack/react-router";
import { ActivityFeedPage } from "@/components/ActivityFeedPage";

export const Route = createFileRoute("/_app/employee/activity")({
  component: () => <ActivityFeedPage scope="employee" />,
});
