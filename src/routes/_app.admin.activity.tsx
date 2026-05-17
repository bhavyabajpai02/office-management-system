import { createFileRoute } from "@tanstack/react-router";
import { ActivityFeedPage } from "@/components/ActivityFeedPage";

export const Route = createFileRoute("/_app/admin/activity")({
  component: () => <ActivityFeedPage scope="admin" />,
});
