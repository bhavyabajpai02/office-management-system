import { createFileRoute } from "@tanstack/react-router";
import { ActivityFeedPage } from "@/components/ActivityFeedPage";

export const Route = createFileRoute("/_app/manager/activity")({
  component: () => <ActivityFeedPage scope="manager" />,
});
