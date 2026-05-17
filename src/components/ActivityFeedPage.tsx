import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Activity, Clock, Loader2 } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth-context";
import { getDemoGoalWorkspace, getEnterpriseSnapshot } from "@/lib/demo-workflows";

export function ActivityFeedPage({ scope }: { scope: "employee" | "manager" | "admin" }) {
  const { user } = useAuth();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activity-feed", scope, user?.id],
    queryFn: async () => {
      if (scope === "employee") {
        return getDemoGoalWorkspace(user?.id).activity;
      }
      return getEnterpriseSnapshot().activity;
    },
  });

  const filteredActivities = activities.filter((activity) => {
    if (scope === "admin") return true;
    if (scope === "manager") return true; // Could filter by team members if we had manager ID on the activity
    return true; // employee is already filtered by getDemoGoalWorkspace
  });

  return (
    <div>
      <PageHeader
        title={
          scope === "admin"
            ? "Organization Activity"
            : scope === "manager"
              ? "Team Activity Feed"
              : "My Activity History"
        }
        description="A real-time audit log of workflow events, approvals, and system notifications."
      />

      <SectionCard title="Recent Events">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 opacity-20 mb-4" />
            <p>No activity recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((event) => (
              <div
                key={event.id}
                className="flex gap-4 p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="mt-0.5">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-accent/10 text-accent">
                    <Activity className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{event.action}</div>
                    <div className="flex items-center text-xs text-muted-foreground shrink-0">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{event.detail}</div>
                  <div className="text-xs font-medium text-muted-foreground mt-2 flex items-center gap-2">
                    <span className="capitalize text-foreground">{event.actor}</span>
                    <span className="opacity-50">•</span>
                    <span className="capitalize">{event.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
